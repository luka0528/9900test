// src/lib/email.ts
import { Resend } from "resend";
import z from "zod";

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to send verification email
export const sendVerificationEmail = async ({
  email,
  token,
  name,
}: {
  email: string;
  token: string;
  name?: string | null;
}) => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Your T3 App";

  try {
    const { data, error } = await resend.emails.send({
      from: `noreply@${process.env.RESEND_DOMAIN}`,
      to: email,
      subject: `Verify your email for ${appName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Email Verification</h1>
          <p>Hello ${name ?? "there"},</p>
          <p>Thank you for signing up for ${appName}. Please use the verification code below to confirm your email address:</p>
          <div style="background-color: #f4f4f4; padding: 12px; font-size: 24px; text-align: center; letter-spacing: 4px; font-weight: bold; margin: 20px 0;">
            ${token}
          </div>
          <p>This code will expire in 30 minutes.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p>Thanks,<br>The ${appName} Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(error.message);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw error;
  }
};

// Function to send password reset email
export const sendPasswordResetEmail = async ({
  email,
  token,
  name,
}: {
  email: string;
  token: string;
  name?: string | null;
}) => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Your T3 App";

  try {
    const { data, error } = await resend.emails.send({
      from: `noreply@${process.env.RESEND_DOMAIN}`,
      to: email,
      subject: `Reset your password for ${appName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Password Reset</h1>
          <p>Hello ${name ?? "there"},</p>
          <p>We received a request to reset your password for ${appName}. Please use the verification code below to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 12px; font-size: 24px; text-align: center; letter-spacing: 4px; font-weight: bold; margin: 20px 0;">
            ${token}
          </div>
          <p>This code will expire in 60 minutes.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Thanks,<br>The ${appName} Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending password reset email:", error);
      throw new Error(error.message);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
};

const billingEmailSchema = z.object({
  paymentSuccess: z.boolean(),
  userName: z.string(),
  payerEmail: z.string().email(),
  serviceName: z.string(),
  subscriptionTierName: z.string(),
  price: z.number(),
  date: z.string(),
});

export const sendBillingEmail = async ({
  paymentSuccess,
  userName,
  payerEmail,
  serviceName,
  subscriptionTierName,
  price,
  date,
}: z.infer<typeof billingEmailSchema>) => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Your T3 App";
  if (paymentSuccess) {
    try {
      const { data, error } = await resend.emails.send({
        from: `noreply@${process.env.RESEND_DOMAIN}`,
        to: payerEmail,
        subject: `Billing Receipt for ${serviceName} | ${appName}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Billing Receipt</h1>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Thank you for your payment for the <strong>${serviceName}</strong> service. Below are the details of your transaction:</p>
        <ul>
        <li><strong>Service Name:</strong> ${serviceName}</li>
        <li><strong>Subscription Tier:</strong> ${subscriptionTierName}</li>
        <li><strong>Price:</strong> $${price}</li>
        <li><strong>Date:</strong> ${date}</li>
        </ul>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Thanks,<br>The ${appName} Team</p>
      </div>
      `,
      });

      if (error) {
        console.error("Error sending email:", error);
        throw new Error(error.message);
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw error;
    }
  } else {
    try {
      const { data, error } = await resend.emails.send({
        from: `noreply@${process.env.RESEND_DOMAIN}`,
        to: payerEmail,
        subject: `Payment Failed for ${serviceName} | ${appName}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Payment Failed</h1>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>We encountered an issue processing your payment for the <strong>${serviceName}</strong> service. Below are the details:</p>
        <ul>
        <li><strong>Service Name:</strong> ${serviceName}</li>
        <li><strong>Subscription Tier:</strong> ${subscriptionTierName}</li>
        <li><strong>Price:</strong> $${price}</li>
        <li><strong>Date:</strong> ${date}</li>
        </ul>
        <p>Please check your payment information and try again.</p>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Thanks,<br>The ${appName} Team</p>
      </div>
      `,
      });

      if (error) {
        console.error("Error sending email:", error);
        throw new Error(error.message);
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw error;
    }
  }
};
