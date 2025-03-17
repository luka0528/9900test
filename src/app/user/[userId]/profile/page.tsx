"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";
import Image from "next/image";

// Define Zod Schema for validation
const profileSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    bio: z.string().optional(),
    currentPassword: z.string().optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

const UserProfilePage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { userId } = useParams();
  const isOwnProfile = session?.user?.id === userId;
  const [isEditing, setIsEditing] = useState(false);

  // Queries & Mutations
  const { data: userData, isLoading: isLoadingUserProfile } =
    api.user.getUserProfile.useQuery(
      { userId: userId as string },
      { enabled: !!userId },
    );
  const updateNameMutation = api.user.updateName.useMutation();
  const updateEmailMutation = api.user.updateEmail.useMutation();
  const updateBioMutation = api.user.updateBio.useMutation();
  const updatePasswordMutation = api.user.updatePassword.useMutation();
  const validateCurrentPassword =
    api.user.validateCurrentPassword.useMutation();

  // React Hook Form
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData?.name ?? "",
      email: userData?.email ?? "",
      bio: userData?.bio ?? "",
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        name: userData.name ?? "",
        email: userData.email ?? "",
        bio: userData.bio ?? "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [userData, form]);

  // Handle Form Submission
  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      let profileUpdated = false;

      // Update Name if changed
      if (values.name !== userData?.name) {
        await updateNameMutation.mutateAsync({ name: values.name });
        profileUpdated = true;
        if (userData) {
          userData.name = values.name;
        }
      }

      // Update Email if changed
      if (values.email !== userData?.email) {
        await updateEmailMutation.mutateAsync({ email: values.email });
        profileUpdated = true;
        if (userData) {
          userData.email = values.email;
        }
      }

      // Update Bio if changed
      if (values.bio !== userData?.bio) {
        await updateBioMutation.mutateAsync({ bio: values.bio });
        profileUpdated = true;
        if (userData) {
          userData.bio = values.bio;
        }
      }

      // Handle Password Update
      if (values.password) {
        try {
          // Validate current password using a mutation
          await validateCurrentPassword.mutateAsync({
            currentPassword: values.currentPassword ?? "",
          });

          try {
            // If validation succeeds, update the password
            await updatePasswordMutation.mutateAsync({
              password: values.password,
            });
            toast.success("Password updated successfully!");
          } catch {
            toast.error("Failed to update password. Please try again.");
          }
        } catch {
          toast.error("Current password is incorrect.");
          return; // Stops execution if password validation fails
        }
      }

      // Show success message only if profile info was updated
      if (profileUpdated) {
        toast.success("Profile updated successfully!");
      }

      // Exit editing mode after successful updates
      setIsEditing(false);
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  if (status === "loading" || isLoadingUserProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex w-3/4 max-w-3xl flex-col items-center">
          <Skeleton className="flex h-[1000px] w-full items-center justify-center rounded-lg">
            <div className="mr-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-500"></div>
            <span className="block text-center text-xl text-gray-500">
              Loading user profile...
            </span>
          </Skeleton>
          <span className="mt-4 block text-center text-xl text-gray-500">
            Loading user profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-3/4 justify-center p-6">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-semibold">Profile Settings</h2>
          <p className="text-sm text-gray-500">
            {isOwnProfile
              ? "Edit your profile details"
              : `${userData?.name}'s profile`}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-6">
            {userData?.image ? (
              <Image
                src={userData?.image || "/default-profile.png"}
                alt="Profile"
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-gray-200 text-gray-500">
                No Image
              </div>
            )}
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      {isEditing ? (
                        <Input type="name" {...field} />
                      ) : (
                        <div className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                          {field.value ?? "No name set"}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      {isEditing ? (
                        <Input type="email" {...field} />
                      ) : (
                        <div className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                          {field.value ?? "No email set"}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      {isEditing ? (
                        <textarea
                          {...field}
                          className="min-h-[10rem] w-full resize-none overflow-hidden rounded-lg border px-3 py-2 text-left align-top text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                          rows={1} // Ensures it starts small but expands
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto"; // Reset height
                            target.style.height = `${target.scrollHeight}px`; // Expand height dynamically
                          }}
                        />
                      ) : (
                        <div className="min-h-[10rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                          {field.value ?? "No bio set"}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              {isEditing && userData?.emailVerified && (
                <>
                  <Separator />
                  <h3 className="text-lg font-semibold">Change Password</h3>
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Submit and Edit Buttons */}
              {isEditing ? (
                <div className="flex space-x-4">
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      form.reset({
                        name: userData?.name ?? "",
                        email: userData?.email ?? "",
                        bio: userData?.bio ?? "",
                        currentPassword: "",
                        password: "",
                        confirmPassword: "",
                      });
                    }}
                    className="w-full hover:bg-red-400"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full hover:bg-green-400">
                    Save Changes
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="w-full">
                  Edit Profile
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
