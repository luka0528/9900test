"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Form schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  // Initialize form
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Request password reset mutation
  const { mutate: requestPasswordReset, isPending: isRequestingPasswordReset } =
    api.user.requestPasswordReset.useMutation({
      onSuccess: () => {
        router.push("/reset-password?email=" + form.getValues().email);
        // setSuccess(true);
        // toast.success(
        //   "If an account exists with this email, we've sent you password reset instructions.",
        // );
        // // Clear the form
        // form.reset();
      },
      onError: () => {
        router.push("/reset-password?email=" + form.getValues().email);
        // // Don't show actual error to prevent email enumeration attacks
        // // Just show the same success message
        // setSuccess(true);
        // toast.success(
        //   "If an account exists with this email, we've sent you password reset instructions.",
        // );
        // form.reset();
      },
    });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    requestPasswordReset({ email: data.email });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a code to reset your password
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-80 flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="name@example.com"
                    type="email"
                    autoComplete="email"
                    disabled={isRequestingPasswordReset}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isRequestingPasswordReset}
          >
            {isRequestingPasswordReset && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isRequestingPasswordReset
              ? "Sending reset code..."
              : "Send reset code"}
          </Button>
        </form>
      </Form>
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
