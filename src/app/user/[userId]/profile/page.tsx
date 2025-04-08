"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
// import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import Image from "next/image";
import { api } from "~/trpc/react";

const UserProfilePage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { userId } = useParams();
  const isOwnProfile = session?.user?.id === userId;

  // Queries
  const { data: userData, isLoading: isLoadingUserProfile } =
    api.user.getUserProfile.useQuery(
      { userId: userId as string },
      { enabled: !!userId },
    );

  // Handle loading state
  if (status === "loading" || isLoadingUserProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex w-3/4 max-w-4xl flex-col items-center">
          <span className="mt-4 block text-center text-xl text-gray-500">
            Loading user profile...
          </span>
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl justify-center p-6">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-semibold">
            {isOwnProfile
              ? "Your profile"
              : `${userData?.user?.name}'s profile`}
          </h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-6">
            {userData?.user?.image ? (
              <Image
                src={userData.user.image}
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

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Name</h3>
              <p className="mt-1 rounded-lg border px-3 py-2 text-sm">
                {userData?.user?.name || "Not provided"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium">Email</h3>
              <p className="mt-1 rounded-lg border px-3 py-2 text-sm">
                {userData?.user?.email || "Not provided"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium">Bio</h3>
              <div className="mt-1 min-h-24 rounded-lg border px-3 py-2 text-sm">
                {userData?.user?.bio || "No bio provided"}
              </div>
            </div>
          </div>

          {/* I don't know if we need this??

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Privacy Settings</h3>

            <div className="rounded-md border p-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-4 w-4 rounded-sm border ${userData?.user?.isSubscriptionsPublic ? "bg-primary" : "bg-transparent"}`}
                ></div>
                <div>
                  <p className="font-medium">Subscriptions</p>
                  <p className="text-xs">
                    {userData?.user?.isSubscriptionsPublic
                      ? "Subscriptions are public"
                      : "Subscriptions are private"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-md border p-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-4 w-4 rounded-sm border ${userData?.user?.isRatingsPublic ? "bg-primary" : "bg-transparent"}`}
                ></div>
                <div>
                  <p className="font-medium">Ratings & Reviews</p>
                  <p className="text-xs">
                    {userData?.user?.isRatingsPublic
                      ? "Ratings and reviews are public"
                      : "Ratings and reviews are private"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-md border p-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-4 w-4 rounded-sm border ${userData?.user?.isUserDataCollectionAllowed ? "bg-primary" : "bg-transparent"}`}
                ></div>
                <div>
                  <p className="font-medium">Data Collection</p>
                  <p className="text-xs">
                    {userData?.user?.isUserDataCollectionAllowed
                      ? "Analytics and data collection is allowed"
                      : "Analytics and data collection is disabled"}
                  </p>
                </div>
              </div>
            </div>
          </div> */}

          {isOwnProfile && (
            <Button
              onClick={() => router.push(`/settings/profile`)}
              className="w-full"
            >
              Edit Profile
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
