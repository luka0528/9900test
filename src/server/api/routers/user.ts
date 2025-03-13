// src/server/api/routers/user.ts
import { z } from "zod";
import bcrypt, { hash } from "bcryptjs";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { createVerificationToken, verifyToken } from "~/lib/verification";
import { sendVerificationEmail } from "~/lib/email";
import { VerificationTokenType } from "@prisma/client";

export const userRouter = createTRPCRouter({
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
        console.error("Failed to send verification email:", error);
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
        console.error("Failed to resend verification email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification email",
        });
      }
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

  getUserProfile: protectedProcedure
    .input(
      z.object({
        userId: z.string().min(1, "Invalid user ID"),
      }),
    )
    .query(async ({ ctx, input }) => {
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

  updateUserProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        image: z.string().url().optional(),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, bio, image, password } = input;

      const data: any = { name, bio, image };

      if (password) {
        data.password = await hash(password, 12);
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data,
      });

      if (!updatedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        image: updatedUser.image,
        emailVerified: updatedUser.emailVerified,
      };
    }),

  checkEmailExists: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { email } = input;

      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      });

      return { exists: !!existingUser };
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
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Validate the current password
      if (!user.password) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User password is missing",
        });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      return { success: true };
    }),
});
