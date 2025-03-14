"use client";

import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";


// Form schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();

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
      },
      onError: () => {
        // Don't show actual error to prevent email enumeration attacks
        router.push("/reset-password?email=" + form.getValues().email);
      },
    });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    requestPasswordReset({ email: data.email });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-4"
    >
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
    </motion.div>
  );
}
