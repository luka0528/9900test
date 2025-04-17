import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { BillingStatus, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const waitForPaymentStatus = async (
  paymentIntent: Stripe.PaymentIntent,
  timeoutMs = 5000,
  intervalMs = 1000,
): Promise<{
  success: "SUCCESS" | "RETRY_PAYMENT" | "CONFIRMATION_REQUIRED";
  message: string;
  data: Stripe.PaymentIntent | null;
}> => {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntent.id);

    if (!intent) {
      await stripe.paymentIntents.cancel(paymentIntent.id);
      return {
        success: "RETRY_PAYMENT",
        message: "Payment failed. Please try again.",
        data: null,
      };
    }

    switch (intent.status) {
      case "succeeded":
        return {
          success: "SUCCESS",
          message: "Payment successful",
          data: intent,
        };

      case "requires_action":
        return {
          success: "CONFIRMATION_REQUIRED",
          message:
            "Payment requires authentication. Please complete payment in-session.",
          data: intent,
        };

      case "requires_payment_method":
        return {
          success: "RETRY_PAYMENT",
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
              success: "SUCCESS",
              message: "Payment successful after confirmation",
              data: confirmedIntent,
            };
          } else {
            await stripe.paymentIntents.cancel(paymentIntent.id);
            return {
              success: "RETRY_PAYMENT",
              message: `Payment confirmation failed with status: ${confirmedIntent.status}`,
              data: confirmedIntent,
            };
          }
        } catch {
          return {
            success: "RETRY_PAYMENT",
            message: `Error confirming payment. Please try again.`,
            data: null,
          };
        }

      case "requires_capture":
        await stripe.paymentIntents.cancel(paymentIntent.id);
        return {
          success: "RETRY_PAYMENT",
          message: "Payment failed. Please try again.",
          data: intent,
        };

      case "canceled":
        return {
          success: "RETRY_PAYMENT",
          message: "Payment was canceled. Please try again.",
          data: intent,
        };
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    success: "RETRY_PAYMENT",
    message: "Payment status check timed out.",
    data: null,
  };
};

export const subscriptionRouter = createTRPCRouter({
  createStripePaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string(),
        userId: z.string(),
        subscriptionTierId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { paymentMethodId, subscriptionTierId } = input;

      const subscriptionTier = await ctx.db.subscriptionTier.findUnique({
        where: { id: subscriptionTierId },
        include: {
          service: { include: { owners: true } },
        },
      });

      // 1. Validate the service/tier
      if (!subscriptionTier) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service or Tier not found",
        });
      }

      // 4) Verify the payment method belongs to the user
      const paymentMethod = await ctx.db.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });
      if (!paymentMethod || paymentMethod.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Payment method not found or doesn't belong to user",
        });
      }

      // 5) TODO: Call Stripe
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { email: true, name: true, stripeCustomerId: true },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const existingSubscription = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscriptionTier: {
            id: subscriptionTierId,
          },
        },
      });

      if (
        existingSubscription &&
        existingSubscription.id === subscriptionTierId &&
        existingSubscription.subscriptionStatus === "ACTIVE"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already subscribed to this tier",
        });
      }

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: user.name ?? undefined,
        });
        stripeCustomerId = customer.id;
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { stripeCustomerId },
        });
      }

      // Create a one-time payment (PaymentIntent) for the subscription amount
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(subscriptionTier.price * 100), // amount in cents
        currency: "aud",
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description: `Subscription to ${subscriptionTier.service.name}, for ${subscriptionTier.name}`,
        metadata: {
          userId: ctx.session.user.id,
          subscriptionTierId,
        },
      });

      const res = await waitForPaymentStatus(paymentIntent);

      // 6) Create an incoming billing receipt for purchaser
      await ctx.db.billingReceipt.create({
        data: {
          amount: subscriptionTier.price,
          description: `Subscription to ${subscriptionTier.name}`,
          fromId: subscriptionTier.service.owners[0]?.userId ?? "",
          toId: ctx.session.user.id ?? "",
          status:
            res.success === "SUCCESS"
              ? BillingStatus.PAID
              : res.success === "CONFIRMATION_REQUIRED"
                ? BillingStatus.PENDING
                : BillingStatus.FAILED,
          paymentMethodId: paymentMethodId,
          subscriptionTierId: subscriptionTierId,
        },
      });

      // 7) TODO: Create an outgoing billing receipt for the service owner if payment was successful
      if (res.success === "SUCCESS") {
        await ctx.db.billingReceipt.create({
          data: {
            amount: subscriptionTier.price,
            description: `Subscription to ${subscriptionTier.name}`,
            fromId: ctx.session.user.id ?? "",
            toId: subscriptionTier.service.owners[0]?.userId ?? "",
            status: BillingStatus.RECEIVED,
            paymentMethodId: paymentMethodId,
            subscriptionTierId: subscriptionTierId,
          },
        });
      }
    }),

  subscribeToTier: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        tierId: z.string(),
        paymentMethodId: z.string(),
        autoRenewal: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { serviceId, tierId, paymentMethodId, autoRenewal } = input;

      // 1. Validate the service
      const service = await ctx.db.service.findUnique({
        where: { id: serviceId },
        include: {
          subscriptionTiers: true,
          owners: true,
        },
      });

      if (!service) {
        return {
          success: false,
          message: "Service not found.",
        };
      }

      // 2. Validate the tier
      const tier = service.subscriptionTiers.find((tier) => tier.id === tierId);
      if (!tier) {
        return {
          success: false,
          message: "Tier not found.",
        };
      }

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
      const existingSubscription = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscriptionTier: {
            serviceId: service.id,
          },
        },
      });

      if (
        existingSubscription &&
        existingSubscription.id === tier.id &&
        existingSubscription.subscriptionStatus === "ACTIVE"
      ) {
        return {
          success: false,
          message: "Already subscribed to this tier.",
        };
      }

      if (existingSubscription) {
        if (existingSubscription.id === tier.id) {
          await ctx.db.serviceConsumer.update({
            where: { id: existingSubscription.id },
            data: {
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionTierId: tier.id,
              paymentMethodId: paymentMethodId,
              renewingSubscription: autoRenewal,
              subscriptionStartDate: new Date(),
              lastRenewed: new Date(),
            },
          });
        } else {
          await ctx.db.serviceConsumer.update({
            where: { id: existingSubscription.id },
            data: {
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              subscriptionTierId: tier.id,
              paymentMethodId: paymentMethodId,
              renewingSubscription: autoRenewal,
              subscriptionStartDate: new Date(),
              lastRenewed: new Date(),
            },
          });
        }
      } else {
        await ctx.db.serviceConsumer.create({
          data: {
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            userId: ctx.session.user.id,
            subscriptionTierId: tier.id,
            paymentMethodId: tier.price ? paymentMethodId : undefined,
            renewingSubscription: autoRenewal,
          },
        });
      }
      return { success: true, message: "Successfully subscribed to service." };
    }),

  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  unsubscribeToTier: protectedProcedure
    .input(
      z.object({
        subscriptionTierId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { subscriptionTierId } = input;

      // 1) Find the subscription
      const subscription = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscriptionTierId,
        },
        include: {
          subscriptionTier: true,
        },
      });
      if (!subscription) {
        return {
          success: false,
          message: "Subscription not found.",
        };
      }

      // 3) Update the subscription record
      await ctx.db.serviceConsumer.update({
        where: { id: subscription.id },
        data: {
          subscriptionStatus:
            subscription.subscriptionTier.price !== 0
              ? SubscriptionStatus.PENDING_CANCELLATION
              : SubscriptionStatus.CANCELLED,
        },
      });

      // 4) If service was free (i.e. cancelled immediately), revoke the API key here

      return { success: true, message: "Subscription cancelled." };
    }),

  deleteSubscription: protectedProcedure
    .input(z.object({ subscriptionTierId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { subscriptionTierId } = input;
      // 1) Find the subscription
      const subscription = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: ctx.session.user.id,
          subscriptionTierId,
        },
      });
      if (!subscription) {
        return {
          success: false,
          message: "Subscription not found.",
        };
      }

      // 2) Check subscription isnt active
      if (subscription.subscriptionStatus == SubscriptionStatus.ACTIVE) {
        return {
          success: false,
          message: "Cannot delete an active subscription",
        };
      }

      // 3) Delete the subscription record
      await ctx.db.serviceConsumer.delete({
        where: { id: subscription.id },
      });

      return { success: true, message: "Subscription deleted" };
    }),

  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  /* ~~~~~~~~~ TODO: COMPLETE FUNCTIONALITY ~~~~~~~~~ */
  switchSubscriptionTier: protectedProcedure
    .input(
      z.object({
        oldTierId: z.string(),
        newTierId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { oldTierId, newTierId } = input;

      // 1) Find the user's subscription
      const subscription = await ctx.db.serviceConsumer.findFirst({
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
      if (!subscription) {
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

      // 7) Invoke a API key for the new tier

      // 8) Update the subscription with the new tier
      await ctx.db.serviceConsumer.update({
        where: { id: subscription.id },
        data: { subscriptionTierId: newTier.id },
      });

      return {
        success: true,
        message: "Subscription tier switched successfully",
      };
    }),

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
      where: { toId: ctx.session.user.id },
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

  isUserSubscribedToService: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { serviceId } = input;

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
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // 1) Find all subscriptions that are pending cancellation and have a start date in the past
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
      await ctx.db.serviceConsumer.update({
        where: { id: consumer.id },
        data: { subscriptionStatus: SubscriptionStatus.CANCELLED },
      });

      // 2a) Revoke api key
    }

    return { success: true, count: toCancel.length };
  }),
});
