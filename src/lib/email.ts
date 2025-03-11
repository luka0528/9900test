// src/lib/email.ts
import { Resend } from 'resend';

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
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Your T3 App';
  
  try {
    const { data, error } = await resend.emails.send({
      from: `noreply@${process.env.RESEND_DOMAIN}`,
      to: email,
      subject: `Verify your email for ${appName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Email Verification</h1>
          <p>Hello ${name ?? 'there'},</p>
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