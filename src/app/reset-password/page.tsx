// src/app/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Form schemas
const verifyTokenSchema = z.object({
  token: z.string().length(6, "Verification code must be 6 digits"),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type VerifyTokenFormValues = z.infer<typeof verifyTokenSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [step, setStep] = useState<"verify" | "reset">("verify");

  // Initialize verify token form
  const verifyForm = useForm<VerifyTokenFormValues>({
    resolver: zodResolver(verifyTokenSchema),
    defaultValues: {
      token: "",
    },
  });

  // Initialize reset password form
  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.push("/forgot-password");
    }
  }, [email, router]);

  // Verify token mutation
  const { mutate: verifyToken, isPending: isVerifyingToken } =
    api.user.verifyPasswordResetToken.useMutation({
      onSuccess: () => {
        // Reset the password form before changing steps
        resetForm.reset({
          password: "",
          confirmPassword: "",
        });
        setStep("reset");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  // Reset password mutation
  const { mutate: resetPassword, isPending: isResettingPassword } =
    api.user.resetPassword.useMutation({
      onSuccess: () => {
        router.push("/login?reset=true");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const onVerifySubmit = (data: VerifyTokenFormValues) => {
    verifyToken({
      email,
      token: data.token,
    });
  };

  const onResetSubmit = (data: ResetPasswordFormValues) => {
    resetPassword({
      email,
      password: data.password,
      token: verifyForm.getValues().token,
    });
  };

  if (!email) {
    return null; // Will redirect via useEffect
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-4"
    >
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">
          {step === "verify" ? "Verify your identity" : "Set new password"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "verify"
            ? `Enter the verification code sent to ${email}`
            : "Create a new password for your account"}
        </p>
      </div>

      {step === "verify" ? (
        <Form {...verifyForm}>
          <form
            onSubmit={verifyForm.handleSubmit(onVerifySubmit)}
            className="space-y-6"
          >
            <FormField
              control={verifyForm.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifyingToken}
              >
                {isVerifyingToken && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isVerifyingToken ? "Verifying..." : "Verify Code"}
              </Button>

              <Button
                type="button"
                variant="link"
                className="self-center text-sm"
                onClick={() => router.push("/forgot-password")}
              >
                Request a new code
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...resetForm}>
          <form
            onSubmit={resetForm.handleSubmit(onResetSubmit)}
            className="w-80 space-y-4"
            key="reset-password-form"
          >
            <FormField
              control={resetForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      placeholder="********"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      placeholder="********"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isResettingPassword}
            >
              {isResettingPassword && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isResettingPassword ? "Resetting password..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      )}
      <div className="text-center text-sm">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </motion.div>
  );
}
