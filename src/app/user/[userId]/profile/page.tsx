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
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { Checkbox } from "~/components/ui/checkbox";

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
    isSubscriptionsPublic: z.boolean().optional(),
    isRatingsPublic: z.boolean().optional(),
    isUserDataCollectionAllowed: z.boolean().optional(),
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
  const [isEditingPrivacy, setIsEditingPrivacy] = useState(false);

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
  const updateSubscriptionSettings =
    api.user.updateIsUserSubscriptionsPublic.useMutation();
  const updateRatingSettings = api.user.updateIsUserRatingsPublic.useMutation();
  const updateDataCollectionSettings =
    api.user.updateIsUserDataCollectionAllowed.useMutation();

  // React Hook Form
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData?.user?.name ?? "",
      email: userData?.user?.email ?? "",
      bio: userData?.user?.bio ?? "",
      currentPassword: "",
      password: "",
      confirmPassword: "",
      isSubscriptionsPublic: userData?.user?.isSubscriptionsPublic ?? false,
      isRatingsPublic: userData?.user?.isRatingsPublic ?? false,
      isUserDataCollectionAllowed:
        userData?.user?.isUserDataCollectionAllowed ?? false,
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        name: userData.user?.name ?? "",
        email: userData.user?.email ?? "",
        bio: userData.user?.bio ?? "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
        isSubscriptionsPublic: userData.user?.isSubscriptionsPublic ?? false,
        isRatingsPublic: userData.user?.isRatingsPublic ?? false,
        isUserDataCollectionAllowed:
          userData.user?.isUserDataCollectionAllowed ?? false,
      });
    }
  }, [userData, form]);

  const toggleEditingPrivacy = () => {
    setIsEditingPrivacy(!isEditingPrivacy);
    form.setValue(
      "isSubscriptionsPublic",
      userData?.user?.isSubscriptionsPublic ?? false,
    );
    form.setValue("isRatingsPublic", userData?.user?.isRatingsPublic ?? false);
    form.setValue(
      "isUserDataCollectionAllowed",
      userData?.user?.isUserDataCollectionAllowed ?? false,
    );
  };

  const resetFormPasswordFields = () => {
    form.setValue("currentPassword", "");
    form.setValue("password", "");
    form.setValue("confirmPassword", "");
  };

  // Handle Form Submission
  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      let profileUpdated = false;

      // Update Name if changed
      if (values.name !== userData?.user?.name) {
        await updateNameMutation.mutateAsync({ name: values.name });
        profileUpdated = true;
        if (userData?.success && userData?.user) {
          userData.user.name = values.name;
        }
      }

      // Update Email if changed
      if (values.email !== userData?.user?.email) {
        await updateEmailMutation.mutateAsync({ email: values.email });
        profileUpdated = true;
        if (userData?.success && userData?.user) {
          userData.user.email = values.email;
        }
      }

      // Update Bio if changed
      if (values.bio !== userData?.user?.bio) {
        await updateBioMutation.mutateAsync({ bio: values.bio });
        profileUpdated = true;
        if (userData?.success && userData?.user) {
          userData.user.bio = values.bio ?? "";
        }
      }

      // Handle Password Update
      if (values.password) {
        // Validate current password using a mutation
        const validate = await validateCurrentPassword.mutateAsync({
          currentPassword: values.currentPassword ?? "",
        });

        if (!validate.success || !validate.isValidPassword) {
          toast.error("Current password is incorrect.");
        } else {
          // If validation succeeds, update the password
          const update = await updatePasswordMutation.mutateAsync({
            password: values.password,
          });
          if (update.success) {
            profileUpdated = true;
            toast.success("Password updated successfully!");
          } else {
            toast.error("Failed to update password. Please try again.");
          }
        }
        resetFormPasswordFields();
        return; // Stops execution if password validation fails
      }

      // Handle Subscription Privacy Setting
      if (
        values.isSubscriptionsPublic !== userData?.user?.isSubscriptionsPublic
      ) {
        const update = await updateSubscriptionSettings.mutateAsync({
          isSubscriptionsPublic: values.isSubscriptionsPublic ?? false,
        });
        if (update.success) profileUpdated = true;
        if (userData?.success && userData?.user) {
          userData.user.isSubscriptionsPublic =
            values.isSubscriptionsPublic ?? true;
        }
      }

      // Handle Ratings Privacy Setting
      if (values.isRatingsPublic !== userData?.user?.isRatingsPublic) {
        const update = await updateRatingSettings.mutateAsync({
          isRatingsPublic: values.isRatingsPublic ?? false,
        });
        if (update.success) profileUpdated = true;
        if (userData?.success && userData?.user) {
          userData.user.isRatingsPublic = values.isRatingsPublic ?? true;
        }
      }

      // Handle Data Collection Setting
      if (
        values.isUserDataCollectionAllowed !==
        userData?.user?.isUserDataCollectionAllowed
      ) {
        const update = await updateDataCollectionSettings.mutateAsync({
          isUserDataCollectionAllowed:
            values.isUserDataCollectionAllowed ?? true,
        });
        if (update.success) profileUpdated = true;
        if (userData?.success && userData?.user) {
          userData.user.isUserDataCollectionAllowed =
            values.isUserDataCollectionAllowed ?? true;
        }
      }

      // Show success message only if profile info was updated
      if (profileUpdated) {
        toast.success("Profile updated successfully!");
      }

      // Exit editing mode after successful updates
      setIsEditing(false);
      resetFormPasswordFields();
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
        <div className="flex w-3/4 max-w-4xl flex-col items-center">
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
    <div className="mx-auto flex w-full max-w-4xl justify-center p-6">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-semibold">Profile Settings</h2>
          <p className="text-sm text-gray-500">
            {isOwnProfile
              ? "Edit your profile details"
              : `${userData?.user?.name}'s profile`}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-6">
            {userData?.user?.image ? (
              <Image
                src={userData?.user?.image || "/default-profile.png"}
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
                        <Input type="name" {...field} className="w-1/2" />
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
                        <Input type="email" {...field} className="w-1/2" />
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
                          className="className=w-1/2 min-h-[10rem] w-full resize-none overflow-hidden rounded-lg border px-3 py-2 text-left align-top text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                          rows={1} // Ensures it starts small but expands
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto"; // Reset height
                            target.style.height = `${target.scrollHeight}px`; // Expand height dynamically
                          }}
                        />
                      ) : (
                        <div className="className=w-1/2 min-h-[10rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                          {field.value ?? "No bio set"}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              {isEditing && userData?.user?.emailVerified && (
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
                          <Input type="password" {...field} className="w-1/2" />
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
                          <Input type="password" {...field} className="w-1/2" />
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
                          <Input type="password" {...field} className="w-1/2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Editing Privacy Settings */}
              {isEditing && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    toggleEditingPrivacy();
                  }}
                  className="ufnderline text-sm font-normal hover:font-semibold"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Privacy Settings
                </Button>
              )}

              {isEditing && isEditingPrivacy && (
                <>
                  <FormField
                    control={form.control}
                    name="isSubscriptionsPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Make Your Subscriptions Public</FormLabel>
                          <FormDescription>
                            Enable this option to allow other users to see what
                            you are subscribed to.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isRatingsPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Make Your Ratings & Reviews Public
                          </FormLabel>
                          <FormDescription>
                            Enable this option to allow other users to see your
                            feedback on services.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isUserDataCollectionAllowed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Allow Analytics and Data Collection
                          </FormLabel>
                          <FormDescription>
                            Enable this option to allow the collection of data
                            for analytics purposes. This helps us improve our
                            services and provide a better user experience.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Submit and Edit Buttons */}
              {isEditing ? (
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setIsEditingPrivacy(false);
                      form.reset({
                        name: userData?.user?.name ?? "",
                        email: userData?.user?.email ?? "",
                        bio: userData?.user?.bio ?? "",
                        currentPassword: "",
                        password: "",
                        confirmPassword: "",
                      });
                    }}
                    className="w-full border-gray-300 hover:bg-red-400"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full hover:bg-green-400">
                    Save Changes
                  </Button>
                </div>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(true)} className="w-full">
                    Edit Profile & Privacy Settings
                  </Button>
                  <div style={{ height: "24rem" }}></div>
                </>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
