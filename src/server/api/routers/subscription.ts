import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { BillingStatus, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import { checkOverdueSubscriptions } from "scripts/checkOverdueSubscriptions";
import { api } from "~/trpc/server";
import { appRouter } from "../root";

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
  cancelStripePaymentIntent: protectedProcedure
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

  createStripePaymentIntent: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string(),
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
        payment_method: paymentMethod.stripePaymentId,
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
          fromId: ctx.session.user.id ?? "",
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

      // 7) TODO: Create an outgoing billing receipt for the service owner if payment was successful
      if (res.status === "SUCCESS") {
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

      return res;
    }),

  subscribeToTier: protectedProcedure
    .input(
      z.object({
        tierId: z.string(),
        paymentMethodId: z.string().min(1),
        autoRenewal: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tierId, paymentMethodId, autoRenewal } = input;

      // 2. Validate the tier
      const tier = await ctx.db.subscriptionTier.findUnique({
        where: { id: tierId },
        include: {
          service: { include: { owners: true } },
        },
      });
      if (!tier) {
        return {
          success: false,
          message: "Subscription tier not found.",
        };
      }
      const service = tier.service;

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

      if (existingSubscription) {
        return {
          success: false,
          message:
            "Already subscribed to this tier. To switch tiers, please visit the subscription management page.",
        };
      }

      await ctx.db.serviceConsumer.create({
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          userId: ctx.session.user.id,
          subscriptionTierId: tier.id,
          paymentMethodId: paymentMethodId,
          renewingSubscription: autoRenewal,
        },
      });

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
      const tier = subscription.subscriptionTier;
      const service = tier.service;

      if (tier.price === 0 || !subscription.paymentMethodId) continue;

      const paymentResponse =
        await caller.subscription.createStripePaymentIntent({
          paymentMethodId: subscription.paymentMethodId,
          subscriptionTierId: subscription.subscriptionTierId,
        });

      // Create billing receipt for the attempt
      await ctx.db.billingReceipt.create({
        data: {
          amount: tier.price,
          description: `Subscription to ${tier.name}`,
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
        // Mark as pending cancellation
        await ctx.db.serviceConsumer.update({
          where: { id: subscription.id },
          data: {
            subscriptionStatus: SubscriptionStatus.PENDING_CANCELLATION,
          },
        });
      } else {
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
});
