import { z } from "zod";
import bcrypt, { hash } from "bcryptjs";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { createVerificationToken, verifyToken } from "~/lib/verification";
import { sendVerificationEmail, sendPasswordResetEmail } from "~/lib/email";
import { VerificationTokenType } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const userRouter = createTRPCRouter({
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        bio: z.string().optional(),
        isSubscriptionsPublic: z.boolean().default(false),
        isRatingsPublic: z.boolean().default(false),
        isUserDataCollectionAllowed: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        name,
        email,
        bio,
        isSubscriptionsPublic,
        isRatingsPublic,
        isUserDataCollectionAllowed,
      } = input;

      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name,
          email,
          bio,
          isSubscriptionsPublic,
          isRatingsPublic,
          isUserDataCollectionAllowed,
        },
      });

      return { success: true, user: updatedUser };
    }),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input;

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }

      // Hash the password
      const hashedPassword = await hash(password, 12);

      // Create the user
      const user = await ctx.db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      try {
        // Create a verification token
        const verificationToken = await createVerificationToken({
          userId: user.id,
          identifier: email,
          type: VerificationTokenType.EMAIL,
        });

        // Send verification email
        await sendVerificationEmail({
          email,
          token: verificationToken.token,
          name,
        });
      } catch (error) {
        console.error(
          "Failed to send verification email:",
          error instanceof Error ? error.message : error,
        );
        // Don't fail the registration if email sending fails
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    }),

  verifyEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        token: z.string().min(6).max(6),
      }),
    )
    .mutation(async ({ input }) => {
      const { email, token } = input;

      const result = await verifyToken({
        token,
        identifier: email,
        type: VerificationTokenType.EMAIL,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error ?? "Invalid or expired verification code",
        });
      }

      return { success: true };
    }),

  resendVerificationEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Find the user
      const user = await ctx.db.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email is already verified",
        });
      }

      try {
        // Create a new verification token
        const verificationToken = await createVerificationToken({
          userId: user.id,
          identifier: email,
          type: VerificationTokenType.EMAIL,
        });

        // Send verification email
        await sendVerificationEmail({
          email,
          token: verificationToken.token,
          name: user.name,
        });

        return { success: true };
      } catch (error) {
        console.error(
          "Failed to resend verification email:",
          error instanceof Error ? error.message : error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification email",
        });
      }
    }),

  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      // Find the user
      const user = await ctx.db.user.findUnique({
        where: { email },
      });

      // Don't reveal if user exists or not for security reasons
      if (!user) {
        // Return success even if no user found to prevent email enumeration attacks
        return { success: true };
      }

      try {
        // Create a password reset token
        const resetToken = await createVerificationToken({
          userId: user.id,
          identifier: email,
          type: VerificationTokenType.PASSWORD_RESET,
          expiresIn: 60, // Expires in 60 minutes
        });

        // Send password reset email
        await sendPasswordResetEmail({
          email,
          token: resetToken.token,
          name: user.name,
        });

        return { success: true };
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send password reset email",
        });
      }
    }),

  verifyPasswordResetToken: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        token: z.string().min(6).max(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email, token } = input;

      // Find the token
      const resetToken = await ctx.db.verificationToken.findFirst({
        where: {
          identifier: email,
          token,
          type: VerificationTokenType.PASSWORD_RESET,
          expires: {
            gt: new Date(),
          },
        },
      });

      if (!resetToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset code",
        });
      }

      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        token: z.string().min(6).max(6),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email, token, password } = input;

      // Find the token again to make sure it's valid
      const resetToken = await ctx.db.verificationToken.findFirst({
        where: {
          identifier: email,
          token,
          type: VerificationTokenType.PASSWORD_RESET,
          expires: {
            gt: new Date(),
          },
        },
      });

      if (!resetToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset code",
        });
      }

      // Find the user
      const user = await ctx.db.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Hash the new password
      const hashedPassword = await hash(password, 12);

      // Update user's password
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          // Also mark email as verified if it wasn't already
          emailVerified: user.emailVerified ?? new Date(),
        },
      });

      // Delete the reset token
      await ctx.db.verificationToken.delete({
        where: { token: resetToken.token },
      });

      return { success: true };
    }),

  // Protected route example - get current user's profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        image: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  // Get user profile by ID
  getUserProfile: protectedProcedure
    .input(
      z.object({
        userId: z.string().min(1, "Invalid user ID"),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { userId } = input;
        const user = await ctx.db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            image: true,
            emailVerified: true,
            isSubscriptionsPublic: true,
            isRatingsPublic: true,
            isUserDataCollectionAllowed: true,
          },
        });
        return user ? { success: true, user } : { success: false };
      } catch {
        return { success: false };
      }
    }),

  checkEmailExists: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { email } = input;
        const existingUser = await ctx.db.user.findUnique({
          where: { email },
        });
        return { success: true, exists: !!existingUser };
      } catch {
        return { success: false };
      }
    }),

  updatePassword: protectedProcedure
    .input(
      z.object({
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { password } = input;

      // Hash the new password
      const hashedPassword = await hash(password, 12);

      // Update user's password
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedPassword },
      });

      return { success: true };
    }),

  validateCurrentPassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z
          .string()
          .min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword } = input;

      // Find the user
      try {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
        });
        // Validate the current password
        const isValid = await bcrypt.compare(
          currentPassword,
          user?.password ?? "",
        );
        return isValid
          ? { success: true, isValidPassword: true }
          : { success: true, isValidPassword: false };
      } catch {
        return { success: false };
      }
    }),

  initializeSetupIntent: protectedProcedure.mutation(async ({ ctx }) => {
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

  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    // Fetch payment methods associated with the current user
    const paymentMethods = await ctx.db.paymentMethod.findMany({
      where: { userId: ctx.session.user.id },
    });
    return paymentMethods;
  }),

  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    const receipts = await ctx.db.billingReceipt.findMany({
      where: { userId: ctx.session.user.id },
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
      const isSubscribed = (user?.subscriptions.length ?? 0) > 0;

      // 3) If subscribed, get the tier ID from the first subscription
      let subscriptionTierId: string | null = null;
      if (isSubscribed) {
        subscriptionTierId = user?.subscriptions[0]?.subscriptionTierId ?? null;
      }

      return { isSubscribed, subscriptionTierId };
    }),
});
