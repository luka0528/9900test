"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const verifyEmailSchema = z.object({
  otp: z.string().length(6, "Verification code must be 6 digits"),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      otp: "",
    },
  });

  const { mutate: verifyEmail, isPending: isVerifying } =
    api.user.verifyEmail.useMutation({
      onSuccess: () => {
        router.push("/login?verified=true");
      },
      onError: (error) => {
        toast.error(error.message);
        form.setError("otp", {
          message: "Invalid verification code",
        });
      },
    });

  const { mutate: resendEmail, isPending: isResending } =
    api.user.resendVerificationEmail.useMutation({
      onSuccess: () => {
        form.reset();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  useEffect(() => {
    if (!email) {
      router.push("/sign-in");
    }
  }, [email, router]);

  const onSubmit = (values: VerifyEmailFormValues) => {
    verifyEmail({
      email,
      token: values.otp,
    });
  };

  const handleResendCode = () => {
    resendEmail({ email });
  };

  if (!email) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-sm text-muted-foreground">
          Please enter the 6-digit verification code sent to your email address.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="otp"
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

          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isVerifying ? "Verifying..." : "Verify Email"}
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        Didn&apos;t receive a code?{" "}
        <Button
          variant="link"
          onClick={handleResendCode}
          disabled={isResending}
          className="h-auto p-0 font-medium"
        >
          {isResending ? "Sending..." : "Resend code"}
        </Button>
      </div>
      <div className="text-center text-sm">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
