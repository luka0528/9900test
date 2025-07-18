import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { BillingStatus, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import { appRouter } from "../root";
import { sendBillingEmail } from "~/lib/email";
import { notifyServiceConsumer } from "~/lib/notifications";
import { generateApiKeyRequest } from "~/lib/httpRequests";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const waitForPaymentStatus = async (
  paymentIntent: Stripe.PaymentIntent,
  timeoutMs = 5000,
  intervalMs = 1000,
): Promise<{
  success: boolean;
  status: "SUCCESS" | "RETRY_PAYMENT" | "CONFIRMATION_REQUIRED";
  message: string;
  data: Stripe.PaymentIntent;
}> => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntent.id);

    if (!intent) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
      return {
        success: false,
        status: "RETRY_PAYMENT",
        message: "Payment failed. Please try again.",
        data: intent,
      };
    }

    switch (intent.status) {
      case "succeeded":
        return {
          success: true,
          status: "SUCCESS",
          message: "Payment successful",
          data: intent,
        };

      case "requires_action":
        return {
          success: false,
          status: "CONFIRMATION_REQUIRED",
          message: "Payment requires confirmation.",
          data: intent,
        };

      case "requires_payment_method":
        return {
          success: false,
          status: "RETRY_PAYMENT",
          message: "Payment failed. Please try another payment method.",
          data: intent,
        };

      case "requires_confirmation":
        try {
          const confirmedIntent = await stripe.paymentIntents.confirm(
            paymentIntent.id,
          );
          if (confirmedIntent.status === "succeeded") {
            return {
              success: true,
              status: "SUCCESS",
              message: "Payment successful after confirmation",
              data: confirmedIntent,
            };
          } else {
            await stripe.paymentIntents.cancel(paymentIntent.id);
            return {
              success: false,
              status: "RETRY_PAYMENT",
              message: `Payment confirmation failed with status: ${confirmedIntent.status}`,
              data: confirmedIntent,
            };
          }
        } catch {
          return {
            success: false,
            status: "RETRY_PAYMENT",
            message: `Error confirming payment. Please try again.`,
            data: intent,
          };
        }

      case "requires_capture":
        await stripe.paymentIntents.cancel(paymentIntent.id);
        return {
          success: false,
          status: "RETRY_PAYMENT",
          message: "Payment failed. Please try again.",
          data: intent,
        };

      case "canceled":
        return {
          success: false,
          status: "RETRY_PAYMENT",
          message: "Payment was canceled. Please try again.",
          data: intent,
        };
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    success: false,
    status: "RETRY_PAYMENT",
    message: "Payment status check timed out.",
    data: paymentIntent,
  };
};

export const subscriptionRouter = createTRPCRouter({
  createStripePaymentIntent: publicProcedure
    .input(
      z.object({
        paymentMethodId: z.string(),
        subscriptionTierId: z.string(),
        userId: z.string().optional(),
        renewalPayment: z.boolean().optional(),
      }),
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{
        success: boolean;
        message: string;
        status:
          | "SUCCESS"
          | "FAILED"
          | "RETRY_PAYMENT"
          | "CONFIRMATION_REQUIRED";
        data: Stripe.PaymentIntent | null;
      }> => {
        const { renewalPayment, userId, paymentMethodId, subscriptionTierId } =
          input;
        if (!userId && !(ctx.session && ctx.session.user)) {
          return {
            success: false,
            message: "User was not found",
            status: "RETRY_PAYMENT",
            data: null,
          };
        }
        const payerId = userId ?? ctx.session?.user.id;

        const subscriptionTier = await ctx.db.subscriptionTier.findUnique({
          where: { id: subscriptionTierId },
          include: {
            service: { include: { owners: true } },
          },
        });

        // 1. Validate the service/tier
        if (!subscriptionTier) {
          return {
            success: false,
            message: "Service or subscription tier not found",
            status: "FAILED",
            data: null,
          };
        }

        // 4) Verify the payment method belongs to the user
        const paymentMethod = await ctx.db.paymentMethod.findUnique({
          where: { id: paymentMethodId },
        });
        if (!paymentMethod || paymentMethod.userId !== payerId) {
          return {
            success: false,
            message: "Chosen payment method not found",
            status: "FAILED",
            data: null,
          };
        }

        // 5) Call Stripe
        const user = await ctx.db.user.findUnique({
          where: { id: payerId },
          select: { email: true, name: true, stripeCustomerId: true },
        });
        if (!user) {
          return {
            success: false,
            message: "User not found",
            status: "FAILED",
            data: null,
          };
        }

        const existingSubscription = await ctx.db.serviceConsumer.findFirst({
          where: {
            userId: payerId,
            subscriptionTier: {
              id: subscriptionTierId,
            },
          },
        });

        if (
          !renewalPayment && // If not a renewal payment
          existingSubscription &&
          existingSubscription.id === subscriptionTierId &&
          existingSubscription.subscriptionStatus === "ACTIVE"
        ) {
          return {
            success: false,
            message:
              "You are already subscribed to this tier. To switch tiers, please visit the subscription management page.",
            status: "FAILED",
            data: null,
          };
        }

        if (subscriptionTier.price === 0) {
          return {
            success: true,
            message: "Free subscription, no payment required.",
            status: "SUCCESS",
            data: null,
          };
        }

        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: user.email ?? undefined,
            name: user.name ?? undefined,
          });
          stripeCustomerId = customer.id;
          await ctx.db.user.update({
            where: { id: payerId },
            data: { stripeCustomerId },
          });
        }

        // Create a one-time payment (PaymentIntent) for the subscription amount
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(subscriptionTier.price * 100), // amount in cents
          currency: "aud",
          customer: stripeCustomerId,
          payment_method: paymentMethod.stripePaymentId,
          off_session: true,
          confirm: true,
          description: `Subscription to ${subscriptionTier.service.name}, for ${subscriptionTier.name}`,
          metadata: {
            userId: payerId,
            subscriptionTierId,
          },
        });

        const res = await waitForPaymentStatus(paymentIntent);

        // 6) Create an incoming billing receipt for purchaser
        await ctx.db.billingReceipt.create({
          data: {
            amount: subscriptionTier.price,
            description: `${subscriptionTier.service.name} | ${subscriptionTier.name}`,
            fromId: payerId ?? "",
            toId: subscriptionTier.service.owners[0]?.userId ?? "",
            status:
              res.status === "SUCCESS"
                ? BillingStatus.PAID
                : res.status === "CONFIRMATION_REQUIRED"
                  ? BillingStatus.PENDING
                  : BillingStatus.FAILED,
            paymentMethodId: paymentMethodId,
            subscriptionTierId: subscriptionTierId,
          },
        });

        // 7) Create an email receipt for the user
        await sendBillingEmail({
          paymentSuccess: res.status === "SUCCESS",
          userName: user.name ?? "",
          payerEmail: user.email ?? "",
          serviceName: subscriptionTier.service.name,
          subscriptionTierName: subscriptionTier.name,
          price: subscriptionTier.price,
          date: new Date().toLocaleDateString(),
        });
        return res;
      },
    ),

  cancelStripePaymentIntent: publicProcedure
    .input(z.object({ paymentIntentId: z.string() }))
    .mutation(async ({ input }) => {
      const { paymentIntentId } = input;
      // 1) Find the payment intent
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent) {
        return {
          success: false,
          message: "Payment intent not found",
        };
      }

      // 2) Cancel the payment intent
      try {
        await stripe.paymentIntents.cancel(paymentIntentId);
      } catch {
        return {
          success: false,
          message: "Failed to cancel payment intent",
        };
      }

      return {
        success: true,
        message: "Payment intent cancelled successfully",
      };
    }),

  subscribeToTier: protectedProcedure
    .input(
      z.object({
        tierId: z.string(),
        paymentMethodId: z.string().min(1),
        autoRenewal: z.boolean().default(false),
      }),
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{ success: boolean; message: string }> => {
        const { tierId, paymentMethodId, autoRenewal } = input;
        const caller = appRouter.createCaller(ctx);

        // 2. Validate the tier
        const subscriptionTier = await ctx.db.subscriptionTier.findUnique({
          where: { id: tierId },
          include: {
            service: { include: { owners: true } },
          },
        });
        if (!subscriptionTier) {
          return {
            success: false,
            message: "Subscription tier not found.",
          };
        }
        const service = subscriptionTier.service;

        // 4) Verify the payment method belongs to the user
        const paymentMethod = await ctx.db.paymentMethod.findUnique({
          where: { id: paymentMethodId },
        });
        if (!paymentMethod || paymentMethod.userId !== ctx.session.user.id) {
          return {
            success: false,
            message: "Payment method not found.",
          };
        }

        // 9. Update or create the subscription
        const existingServiceConsumer = await ctx.db.serviceConsumer.findFirst({
          where: {
            userId: ctx.session.user.id,
            subscriptionTier: {
              serviceId: service.id,
            },
          },
        });

        if (
          existingServiceConsumer?.subscriptionStatus ===
          SubscriptionStatus.ACTIVE
        ) {
          return {
            success: false,
            message:
              "Already subscribed to this tier. To switch tiers, please visit the subscription management page.",
          };
        }
        // 10) GENERATE API KEY:
        const newKey = await caller.subscription.generateAPIKey({
          subscriptionTierId: tierId,
        });

        // 11) deal with existing consumer
        if (existingServiceConsumer) {
          // 11a) Revoke existing API key
          await caller.subscription.revokeAPIKey({
            userId: ctx.session.user.id,
            subscriptionTierId: existingServiceConsumer.subscriptionTierId,
          });
          // 11b) Update user details
          await ctx.db.serviceConsumer.update({
            where: { id: existingServiceConsumer.id },
            data: {
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              renewingSubscription: autoRenewal,
              lastRenewed: new Date(),
              apiKey: newKey.data,
            },
          });
        } else {
          // 11c) Else create a new subscription
          await ctx.db.serviceConsumer.create({
            data: {
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              userId: ctx.session.user.id,
              subscriptionTierId: subscriptionTier.id,
              paymentMethodId: paymentMethodId,
              renewingSubscription: autoRenewal,
              apiKey: newKey.data,
            },
          });
        }

        return {
          success: true,
          message: "Successfully subscribed to service.",
        };
      },
    ),

  unsubscribeToTier: protectedProcedure
    .input(
      z.object({
        subscriptionTierId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { subscriptionTierId } = input;
      const caller = appRouter.createCaller(ctx);

      // 1) Find the subscription
      const serviceConsumer = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscriptionTierId,
        },
        include: {
          subscriptionTier: true,
        },
      });
      if (!serviceConsumer) {
        return {
          success: false,
          message: "Subscription not found.",
        };
      }

      // 3) TODO: REVOKE OLD API KEY
      if (serviceConsumer.subscriptionTier.price === 0) {
        await caller.subscription.revokeAPIKey({
          userId: serviceConsumer.userId,
          subscriptionTierId: serviceConsumer.subscriptionTierId,
        });
      }

      // 4) Update the subscription record
      await ctx.db.serviceConsumer.update({
        where: { id: serviceConsumer.id },
        data: {
          subscriptionStatus:
            serviceConsumer.subscriptionTier.price !== 0
              ? SubscriptionStatus.PENDING_CANCELLATION
              : SubscriptionStatus.CANCELLED,
        },
      });

      return { success: true, message: "Subscription cancelled." };
    }),

  deleteSubscription: protectedProcedure
    .input(z.object({ subscriptionTierId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { subscriptionTierId } = input;
      const caller = appRouter.createCaller(ctx);

      // 1) Find the subscription
      const serviceConsumer = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscriptionTierId,
        },
      });
      if (!serviceConsumer) {
        return {
          success: false,
          message: "Subscription not found.",
        };
      }

      // 2) Check subscription isnt active
      if (serviceConsumer.subscriptionStatus == SubscriptionStatus.ACTIVE) {
        return {
          success: false,
          message: "Cannot delete an active subscription",
        };
      }

      // 3) Delete the subscription record
      await ctx.db.serviceConsumer.delete({
        where: { id: serviceConsumer.id },
      });

      // 4) Final check that any existing API keys are revoked
      await caller.subscription.revokeAPIKey({
        userId: serviceConsumer.userId,
        subscriptionTierId: serviceConsumer.subscriptionTierId,
      });

      return { success: true, message: "Subscription deleted" };
    }),

  switchSubscriptionTier: protectedProcedure
    .input(
      z.object({
        oldTierId: z.string(),
        newTierId: z.string(),
      }),
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{ success: boolean; message: string }> => {
        const { oldTierId, newTierId } = input;
        const caller = appRouter.createCaller(ctx);

        // 1) Find the user's subscription
        const serviceConsumer = await ctx.db.serviceConsumer.findFirst({
          where: {
            userId: ctx.session.user.id,
            subscriptionTierId: oldTierId,
          },
          include: {
            subscriptionTier: {
              include: {
                service: {
                  include: {
                    owners: true,
                  },
                },
              },
            },
          },
        });
        if (!serviceConsumer) {
          return {
            success: false,
            message: "Subscription not found.",
          };
        }

        // 2) Validate the new tier
        const newTier = await ctx.db.subscriptionTier.findUnique({
          where: { id: newTierId },
        });
        if (!newTier) {
          return {
            success: false,
            message: "New tier not found.",
          };
        }

        // 6 Revoke the API key for the old tier
        await caller.subscription.revokeAPIKey({
          userId: ctx.session.user.id,
          subscriptionTierId: serviceConsumer.subscriptionTierId,
        });

        // 7) Invoke a API key for the new tier
        const newKey = await caller.subscription.generateAPIKey({
          subscriptionTierId: serviceConsumer.subscriptionTierId,
        });

        // 8) Update the subscription with the new tier
        await ctx.db.serviceConsumer.update({
          where: { id: serviceConsumer.id },
          data: { subscriptionTierId: newTier.id, apiKey: newKey.data },
        });

        return {
          success: true,
          message: "Subscription tier switched successfully.",
        };
      },
    ),

  updateSubscriptionPaymentMethod: protectedProcedure
    .input(
      z.object({
        subscriptionTierId: z.string(),
        paymentMethodId: z.string(),
        autoRenewal: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { subscriptionTierId, paymentMethodId, autoRenewal } = input;

      // Fetch the subscription by filtering by userId and subscriptionTierId
      const subscription = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscriptionTierId: subscriptionTierId,
        },
        include: {
          subscriptionTier: {
            include: {
              service: true,
            },
          },
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      // Check if the payment method exists and belongs to the user
      const paymentMethod = await ctx.db.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });
      if (!paymentMethod || paymentMethod.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment method not found or does not belong to user",
        });
      }

      // Update the subscription with the new payment method (and auto-renew if needed)
      await ctx.db.serviceConsumer.update({
        where: { id: subscription.id },
        data: {
          paymentMethodId,
          ...(autoRenewal !== undefined && {
            renewingSubscription: autoRenewal,
          }),
        },
      });

      return { success: true };
    }),

  getUserSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    // Ensure the user is authenticated
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    try {
      // Fetch the user's subscriptions
      const subscriptions = await ctx.db.serviceConsumer.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          subscriptionTier: {
            include: {
              service: {
                include: {
                  tags: true,
                },
              },
            },
          },
          paymentMethod: true,
        },
      });

      return { success: true, subscriptions };
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscriptions",
        cause: error,
      });
    }
  }),

  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    const receipts = await ctx.db.billingReceipt.findMany({
      where: {
        OR: [{ fromId: ctx.session.user.id }, { toId: ctx.session.user.id }],
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
          },
        },
        to: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return receipts;
  }),

  isUserSubscribedToService: publicProcedure
    .input(
      z.object({
        serviceId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { serviceId } = input;

      if (!ctx.session) {
        return null;
      }

      // 1) Find the user and their subscriptions, filtered by the requested serviceId
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: {
          subscriptions: {
            where: {
              subscriptionTier: {
                serviceId: serviceId,
              },
            },
          },
        },
      });

      // 2) If we find any matching subscriptions, user is subscribed
      const isSubscribed =
        (user?.subscriptions.length ?? 0) > 0 &&
        user?.subscriptions[0]?.subscriptionStatus ===
          SubscriptionStatus.ACTIVE;

      // 3) If subscribed, get the tier ID from the first subscription
      let subscriptionTierId: string | null = null;
      if (isSubscribed) {
        subscriptionTierId = user?.subscriptions[0]?.subscriptionTierId ?? null;
      }

      return { isSubscribed, subscriptionTierId };
    }),

  resumeSubscription: protectedProcedure
    .input(z.object({ subscriptionTierId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { subscriptionTierId } = input;
      // 1) Find the subscription
      const subscription = await ctx.db.serviceConsumer.findFirst({
        where: { userId: ctx.session.user.id, subscriptionTierId },
      });
      if (!subscription) {
        return {
          success: false,
          message: "Subscription not found",
        };
      }
      // 2) Check subscription status
      if (subscription.subscriptionStatus !== "PENDING_CANCELLATION") {
        return {
          success: false,
          message: "Subscription is not in a cancellable state",
        };
      }

      // 3) Update subscription status
      await ctx.db.serviceConsumer.update({
        where: { userId: ctx.session.user.id, id: subscription.id },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        },
      });

      return {
        success: true,
        message: "Subscription resumed successfully",
      };
    }),

  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    // Fetch payment methods associated with the current user
    const paymentMethods = await ctx.db.paymentMethod.findMany({
      where: { userId: ctx.session.user.id },
    });
    return paymentMethods;
  }),

  deletePaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Find the payment method in the DB
      const pm = await ctx.db.paymentMethod.findUnique({
        where: { id: input.paymentMethodId },
      });

      if (!pm) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment method not found.",
        });
      }

      // 2. Ensure the user owns this payment method
      if (pm.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this payment method.",
        });
      }

      // 3. Detach from Stripe
      await stripe.paymentMethods.detach(pm.stripePaymentId);

      // 4. Delete from the database
      await ctx.db.paymentMethod.delete({
        where: { id: input.paymentMethodId },
      });

      return { success: true };
    }),

  initializeStripeSetupIntent: protectedProcedure.mutation(async ({ ctx }) => {
    // Fetch the current user from the database.
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
    });
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (!user.email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Email is required to create a Stripe customer. Fix this in your profile settings.",
      });
    }

    if (!user.name) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "A name is required to create a Stripe customer. Fix this in your profile settings.",
      });
    }

    let stripeCustomerId = user.stripeCustomerId;
    // If the user does not already have a Stripe customer ID, create one.
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      stripeCustomerId = customer.id;
      await ctx.db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // Create a SetupIntent associated with the Stripe customer.
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
    });

    if (!setupIntent.client_secret) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create SetupIntent",
      });
    }

    return { clientSecret: setupIntent.client_secret };
  }),

  // Procedure to save the PaymentMethod returned by Stripe.
  savePaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string(), // Stripe PaymentMethod ID (pm_xxx)
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch the user
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      if (!user?.stripeCustomerId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User or Stripe customer ID not found",
        });
      }

      // 2. Attach the payment method to Stripe (so it's linked to this customer)
      await stripe.paymentMethods.attach(input.paymentMethodId, {
        customer: user.stripeCustomerId,
      });

      // 3. Retrieve card details from Stripe
      const pm = await stripe.paymentMethods.retrieve(input.paymentMethodId);
      const card = pm.card;
      const cardBrand = card?.brand ?? null;
      const last4 = card?.last4 ?? null;
      const expMonth = card?.exp_month ?? null;
      const expYear = card?.exp_year ?? null;
      const cardholderName = pm.billing_details?.name ?? null;

      // 4. Save the payment method + address in the DB
      await ctx.db.paymentMethod.create({
        data: {
          userId: user.id,
          stripeCustomerId: user.stripeCustomerId,
          stripePaymentId: input.paymentMethodId,
          cardBrand,
          last4,
          expMonth,
          expYear,
          cardholderName,

          // Address fields from the input
          addressLine1: input.addressLine1 ?? null,
          addressLine2: input.addressLine2 ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          postalCode: input.postalCode ?? null,
          country: input.country ?? null,
        },
      });

      return { success: true };
    }),

  checkSubscriptionCancellations: publicProcedure.mutation(async ({ ctx }) => {
    const caller = appRouter.createCaller(ctx);

    // 1) Find all subscriptions that are pending cancellation and have a start date in the past
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const toCancel = await ctx.db.serviceConsumer.findMany({
      where: {
        subscriptionStatus: "PENDING_CANCELLATION",
        lastRenewed: {
          lte: oneMonthAgo,
        },
      },
    });

    // 2) Change their status to cancelled
    for (const consumer of toCancel) {
      // 2a) TODO: Notify the user about the cancellation

      // 2b) Revoke the API key
      await caller.subscription.revokeAPIKey({
        userId: consumer.userId,
        subscriptionTierId: consumer.subscriptionTierId,
      });

      await ctx.db.serviceConsumer.update({
        where: { id: consumer.id },
        data: { subscriptionStatus: SubscriptionStatus.CANCELLED },
      });
    }

    return { success: true, count: toCancel.length };
  }),

  isNewTierLower: protectedProcedure
    .input(
      z.object({
        oldTierId: z.string(),
        newTierId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { oldTierId, newTierId } = input;

      // 1) Find the old and new tiers
      const oldTier = await ctx.db.subscriptionTier.findUnique({
        where: { id: oldTierId },
      });
      const newTier = await ctx.db.subscriptionTier.findUnique({
        where: { id: newTierId },
      });

      if (!oldTier || !newTier) {
        return { success: false, message: "Tier not found" };
      }

      // 2) Compare the prices
      return {
        success: true,
        isLower: newTier.price < oldTier.price || newTier.price === 0,
      };
    }),

  checkSubscriptionRenewals: publicProcedure.mutation(async ({ ctx }) => {
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const overdueSubscriptions = await ctx.db.serviceConsumer.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        renewingSubscription: true,
        lastRenewed: { lte: THIRTY_DAYS_AGO },
      },
      include: {
        subscriptionTier: {
          include: {
            service: {
              include: { owners: true },
            },
          },
        },
      },
    });

    const caller = appRouter.createCaller(ctx);

    let processedCount = 0;

    for (const subscription of overdueSubscriptions) {
      const subscriptionTier = subscription.subscriptionTier;
      const service = subscriptionTier.service;

      if (subscriptionTier.price === 0 || !subscription.paymentMethodId)
        continue;

      const paymentResponse =
        await caller.subscription.createStripePaymentIntent({
          userId: subscription.userId,
          renewalPayment: true,
          paymentMethodId: subscription.paymentMethodId,
          subscriptionTierId: subscription.subscriptionTierId,
        });

      // Create billing receipt for the attempt
      await ctx.db.billingReceipt.create({
        data: {
          amount: subscriptionTier.price,
          description: `${subscriptionTier.service.name} | ${subscriptionTier.name}`,
          fromId: subscription.userId,
          toId: service.owners[0]?.userId ?? "",
          status:
            paymentResponse.status === "SUCCESS"
              ? BillingStatus.PAID
              : paymentResponse.status === "CONFIRMATION_REQUIRED"
                ? BillingStatus.PENDING
                : BillingStatus.FAILED,
          paymentMethodId: subscription.paymentMethodId,
          subscriptionTierId: subscription.subscriptionTierId,
        },
      });

      if (paymentResponse.status !== "SUCCESS") {
        await caller.subscription.revokeAPIKey({
          subscriptionTierId: subscription.subscriptionTierId,
          userId: subscription.userId,
        });

        // Mark as pending cancellation
        // Notify the user about the pending cancellation
        await notifyServiceConsumer(
          ctx.db,
          service.owners[0]?.userId ?? "",
          subscription.userId,
          `Your subscription to ${subscriptionTier.service.name} was not able to be renewed due to payment issues. Please update your payment method or retry.`,
        );
        await ctx.db.serviceConsumer.update({
          where: { id: subscription.id },
          data: {
            subscriptionStatus: SubscriptionStatus.CANCELLED,
          },
        });
      } else {
        await notifyServiceConsumer(
          ctx.db,
          service.owners[0]?.userId ?? "",
          subscription.userId,
          `Your subscription to ${subscriptionTier.service.name} was successfully renewed.`,
        );
        // Mark renewal timestamp
        await ctx.db.serviceConsumer.update({
          where: { id: subscription.id },
          data: {
            lastRenewed: new Date(),
          },
        });
      }

      processedCount++;
    }

    return { success: true, count: processedCount };
  }),

  revokeAPIKey: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        subscriptionTierId: z.string().min(1),
      }),
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{ success: boolean; message: string }> => {
        const { userId, subscriptionTierId } = input;

        const serviceConsumer = await ctx.db.serviceConsumer.findFirst({
          where: { userId, subscriptionTierId },
          include: {
            subscriptionTier: {
              include: {
                service: { select: { masterAPIKey: true, baseEndpoint: true } },
              },
            },
            user: { select: { email: true } },
          },
        });
        if (!serviceConsumer) {
          return {
            success: false,
            message: "Subscription could not be found.",
          };
        }

        const oldAPIKey = serviceConsumer.apiKey ?? "";
        const masterKey =
          serviceConsumer.subscriptionTier.service.masterAPIKey ?? "";
        const serviceUrl =
          serviceConsumer.subscriptionTier.service.baseEndpoint;

        const url = new URL(`${serviceUrl}/api/key`);
        url.searchParams.append("key", oldAPIKey);
        await fetch(url, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${masterKey}`,
            "Content-Type": "application/json",
          },
        })
          .then((response) => response.json())
          .catch(() => {
            return {
              success: false,
              message: `Error revoking key`,
            };
          });

        return { success: true, message: "Key successfully revoked." };
      },
    ),

  generateAPIKey: publicProcedure
    .input(
      z.object({
        subscriptionTierId: z.string().min(1),
      }),
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{
        success: boolean;
        message: string;
        data: string | null;
      }> => {
        const { subscriptionTierId } = input;
        const subscriptionTier = await ctx.db.subscriptionTier.findUnique({
          where: { id: subscriptionTierId },
          include: {
            service: true,
          },
        });
        if (!subscriptionTier) {
          return {
            success: false,
            message: "Subscription tier not found.",
            data: null,
          };
        }

        const masterKey = subscriptionTier.service.masterAPIKey ?? "";
        const serviceUrl = subscriptionTier.service.baseEndpoint;

        const res = await generateApiKeyRequest(
          subscriptionTier.name,
          masterKey,
          serviceUrl,
        );

        if (res.success) {
          return {
            success: true,
            message: "Key successfully generated",
            data: res.data,
          };
        } else {
          return {
            success: false,
            message: "Error generating key.",
            data: null,
          };
        }
      },
    ),

  regenerateAPIKey: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        subscriptionTierId: z.string().min(1),
      }),
    )
    .mutation(
      async ({
        ctx,
        input,
      }): Promise<{
        success: boolean;
        message: string;
        data: string | null;
      }> => {
        const { userId, subscriptionTierId } = input;
        const caller = appRouter.createCaller(ctx);

        const serviceConsumer = await ctx.db.serviceConsumer.findFirst({
          where: { userId, subscriptionTierId },
          include: {
            subscriptionTier: {
              include: { service: { select: { masterAPIKey: true } } },
            },
            user: { select: { email: true } },
          },
        });
        if (!serviceConsumer) {
          return {
            success: false,
            message: "Subscription could not be found.",
            data: null,
          };
        }

        await caller.subscription.revokeAPIKey({ userId, subscriptionTierId });
        const newKey = await caller.subscription.generateAPIKey({
          subscriptionTierId,
        });

        await ctx.db.serviceConsumer.update({
          where: { id: serviceConsumer.id },
          data: { apiKey: newKey.success ? newKey.data : null },
        });

        if (!newKey.success) {
          return {
            success: false,
            message: "New API Key Could not be made. Service may be down.",
            data: null,
          };
        }
        return {
          success: true,
          message: "Key successfully regenerated.",
          data: newKey.data,
        };
      },
    ),
});
