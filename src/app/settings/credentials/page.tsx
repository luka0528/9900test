"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// Schema for password change
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const CredentialsPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // TRPC Mutations
  const validateCurrentPassword =
    api.user.validateCurrentPassword.useMutation();
  const updatePassword = api.user.updatePassword.useMutation();

  // React Hook Form
  const form = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle Form Submission
  const onSubmit = async (values: z.infer<typeof passwordChangeSchema>) => {
    if (!session?.user) {
      toast.error("You must be logged in to change your password");
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate current password
      const validateResult = await validateCurrentPassword.mutateAsync({
        currentPassword: values.currentPassword,
      });

      if (!validateResult.success || !validateResult.isValidPassword) {
        form.setError("currentPassword", {
          type: "manual",
          message: "Current password is incorrect",
        });
        toast.error("Current password is incorrect");
        setIsSubmitting(false);
        return;
      }

      // Update password
      const updateResult = await updatePassword.mutateAsync({
        password: values.newPassword,
      });

      if (updateResult.success) {
        toast.success("Password updated successfully");
        form.reset();
        setIsFormVisible(false);
      } else {
        toast.error("Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("An error occurred while updating your password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordForm = () => {
    setIsFormVisible(!isFormVisible);
    if (!isFormVisible) {
      form.reset();
    }
  };

  const { mutate: requestPasswordReset, isPending: isRequestingPasswordReset } =
    api.user.requestPasswordReset.useMutation();

  const onForgotPassword = () => {
    if (session?.user?.email) {
      toast.success("Verification code sent to your email");
      requestPasswordReset({ email: session.user.email });
      router.push("/reset-password?email=" + session?.user?.email!);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Card className="w-full shadow-lg">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-semibold">Security Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your password and account security
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Email section - read-only display */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Email Address</h3>
              </div>

              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">
                  Your current email address is:
                </p>
                <p className="mt-1 font-medium">{session?.user?.email}</p>
              </div>
            </div>

            <Separator />

            {/* Password change section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Password Change</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePasswordForm}
                >
                  {isFormVisible ? "Hide" : "Change Password"}
                </Button>
              </div>

              {isFormVisible && (
                <div className="rounded-md border p-4">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      {/* Current Password */}
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={
                                    showCurrentPassword ? "text" : "password"
                                  }
                                  placeholder="Enter your current password"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0"
                                  onClick={() =>
                                    setShowCurrentPassword(!showCurrentPassword)
                                  }
                                >
                                  {showCurrentPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <div className="mt-1 flex justify-end">
                              <Button
                                variant="link"
                                type="button"
                                className="h-auto p-0 text-xs text-muted-foreground"
                                onClick={() => {
                                  onForgotPassword();
                                }}
                              >
                                Forgot password?
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* New Password */}
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showNewPassword ? "text" : "password"}
                                  placeholder="Enter your new password"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0"
                                  onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                  }
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Password must be at least 8 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Confirm Password */}
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={
                                    showConfirmPassword ? "text" : "password"
                                  }
                                  placeholder="Confirm your new password"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CredentialsPage;
