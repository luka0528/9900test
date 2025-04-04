"use client";

import { useSession } from "next-auth/react";
import { Separator } from "~/components/ui/separator";
import { Loader2, Package } from "lucide-react";
import { api } from "~/trpc/react";
import { ServiceManagementCard } from "~/components/service/ServiceManagementCard";
import { AllServiceSidebar } from "~/components/service/AllServiceSidebar";
import { useState } from "react";

export default function ServicesPage() {
  const { data: session } = useSession();

  const {
    data: services,
    isLoading,
    error,
    refetch,
  } = api.user.getUserSubscriptions.useQuery();

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AllServiceSidebar />
      <div className="flex h-full grow flex-col">
        <div className="flex min-h-[5rem] items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Your Subscriptions</h1>
        </div>

        <Separator className="mb-6" />

        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex h-32 w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-destructive">
              Error loading subscriptions. Please try again.
            </div>
          ) : !session ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="mb-2 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                Sign in to view your subscriptions
              </h3>
              <p className="text-muted-foreground">
                You need to be logged in to view and manage your subscriptions.
              </p>
            </div>
          ) : services?.subscriptions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="mb-2 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No services found</h3>
              <p className="text-muted-foreground">
                You haven&apos;t subscribed to any services yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {services?.subscriptions
                ?.sort((a, b) =>
                  a.subscriptionTier.service.name.localeCompare(
                    b.subscriptionTier.service.name,
                  ),
                )
                .map((service, index) => (
                  <ServiceManagementCard
                    key={index}
                    service={{
                      id: service.subscriptionTier.service.id,
                      name: service.subscriptionTier.service.name,
                      tierName: service.subscriptionTier.name,
                      tags: service.subscriptionTier.service.tags?.map(
                        (tag) => tag.name,
                      ),
                      subscriptionTier: service.subscriptionTier,
                      refetch: () => {
                        void refetch();
                      },
                    }}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
