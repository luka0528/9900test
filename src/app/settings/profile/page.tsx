"use client";

import React, { useEffect } from "react";
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
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";
import Image from "next/image";
import { Checkbox } from "~/components/ui/checkbox";
import { Loader2 } from "lucide-react";

// Updated schema without password-related fields
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  bio: z.string().optional(),
  isSubscriptionsPublic: z.boolean().optional(),
  isRatingsPublic: z.boolean().optional(),
  isUserDataCollectionAllowed: z.boolean().optional(),
});

const UserProfilePage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id; // will always exist as cant enter settings without profile
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Queries & Mutations
  const { data: userData, isLoading: isLoadingUserProfile } =
    api.user.getUserProfile.useQuery(
      { userId: userId as string },
      { enabled: !!userId },
    );
  const { mutate: updateUser } = api.user.update.useMutation();

  // React Hook Form
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      isSubscriptionsPublic: false,
      isRatingsPublic: false,
      isUserDataCollectionAllowed: false,
    },
  });

  // Update form with user data once loaded
  useEffect(() => {
    if (userData) {
      form.reset({
        name: userData.user?.name ?? "",
        email: userData.user?.email ?? "",
        bio: userData.user?.bio ?? "",
        isSubscriptionsPublic: userData.user?.isSubscriptionsPublic ?? false,
        isRatingsPublic: userData.user?.isRatingsPublic ?? false,
        isUserDataCollectionAllowed:
          userData.user?.isUserDataCollectionAllowed ?? false,
      });
    }
  }, [userData, form]);

  // Handle Form Submission
  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    setIsSubmitting(true);

    try {
      // Update profile information
      await updateUser({
        name: values.name,
        email: values.email,
        bio: values.bio,
        isSubscriptionsPublic: values.isSubscriptionsPublic,
        isRatingsPublic: values.isRatingsPublic,
        isUserDataCollectionAllowed: values.isUserDataCollectionAllowed,
      });

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle loading state
  if (isLoadingUserProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex w-3/4 max-w-4xl flex-col items-center">
          <Skeleton className="h-[500px] w-full rounded-lg" />
          <div className="mt-4 flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-center text-muted-foreground">
              Loading user profile...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Card className="w-full shadow-lg">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-semibold">Profile Settings</h2>
          <p className="text-sm text-muted-foreground">
            Update your profile information and settings
          </p>
        </CardHeader>
        <CardContent>
          {/* Profile Image */}
          <div className="mb-6 flex items-center justify-center">
            {userData?.user?.image ? (
              <Image
                src={userData.user.image}
                alt="Profile"
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>

                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                        <textarea
                          {...field}
                          className="max-h-[12rem] min-h-[8rem] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="Tell us about yourself"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Privacy Settings</h3>

                {/* Subscriptions Public */}
                <FormField
                  control={form.control}
                  name="isSubscriptionsPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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

                {/* Ratings Public */}
                <FormField
                  control={form.control}
                  name="isRatingsPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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

                {/* Data Collection */}
                <FormField
                  control={form.control}
                  name="isUserDataCollectionAllowed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
                          Enable this option to allow the collection of data for
                          analytics purposes. This helps us improve our services
                          and provide a better user experience.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Password info (non-editable) */}
              {userData?.user?.emailVerified && (
                <div className="mt-6 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">
                        Password & Security
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Manage your password and security settings
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/settings/security")}
                      type="button"
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pb-6 pt-2">
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
                    "Update Profile"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
