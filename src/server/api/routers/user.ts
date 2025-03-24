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
<<<<<<< HEAD
import type { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

interface Context {
  db: PrismaClient;
  session: { user: { id: string } };
}

/**
 * Updates a specific user field in the database.
 *
 * @param ctx - The context object containing the database and session information.
 * @param field - The name of the field to update.
 * @param value - The new value to set for the specified field.
 * @returns The updated field value.
 * @throws TRPCError if the user is not found.
 */
const updateUserField = async <K extends keyof User>(
  ctx: Context,
  field: K,
  value: User[K],
) => {
  try {
    const updatedUser = await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { [field]: value },
    });

    return { [field]: updatedUser[field] };
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to update ${field}`,
    });
  }
};
=======
>>>>>>> dev

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
});
