// src/lib/verification.ts
import { randomInt } from "crypto";
import { db } from "~/server/db";
import { VerificationTokenType } from "@prisma/client";
// Generate a random 6-digit OTP
export const generateOTP = () => {
  return randomInt(100000, 999999).toString();
};

// Create a verification token in the database
export const createVerificationToken = async ({
  userId,
  identifier,
  type = VerificationTokenType.EMAIL,
  expiresIn = 30, // minutes
}: {
  userId: string;
  identifier: string;
  type?: VerificationTokenType;
  expiresIn?: number;
}) => {
  const token = generateOTP();
  const expires = new Date(Date.now() + expiresIn * 60 * 1000);

  // Delete any existing tokens for this user and type
  await db.verificationToken.deleteMany({
    where: {
      userId,
      identifier,
      type,
    },
  });

  // Create a new token
  const verificationToken = await db.verificationToken.create({
    data: {
      token,
      expires,
      identifier,
      userId,
      type,
    },
  });

  return verificationToken;
};

// Verify a token from the database
export const verifyToken = async ({
  token,
  identifier,
  type = VerificationTokenType.EMAIL,
}: {
  token: string;
  identifier: string;
  type?: VerificationTokenType;
}) => {
  try {
    // Find the token in the database
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        token,
        identifier,
        type,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      return { success: false, error: "Invalid or expired token" };
    }

    if (type === VerificationTokenType.EMAIL) {
      // Mark the user's email as verified
      await db.user.update({
        where: {
          id: verificationToken.userId,
        },
        data: {
          emailVerified: new Date(),
        },
      });
    }

    // Delete the token after successful verification
    await db.verificationToken.delete({
      where: {
        token: verificationToken.token,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error verifying token:", error);
    return { success: false, error: "Failed to verify token" };
  }
};