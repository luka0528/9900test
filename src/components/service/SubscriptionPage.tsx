"use client"

import { Package } from "lucide-react";
import { api } from "~/trpc/react";
import { ServiceDetailsCard } from "~/components/service/ServiceDetailstCard";
import { SubscriptionStatus } from "@prisma/client";
import { Loading } from "~/components/ui/loading";

export const SubscriptionPage = () => {
    const {
        data: services,
        isLoading,
        error,
        refetch,
    } = api.subscription.getUserSubscriptions.useQuery();


    return (
        <>
            {isLoading ? (
              <Loading />
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
                  ?.filter(
                    (sub) => sub.subscriptionStatus === SubscriptionStatus.ACTIVE,
                  )
                  .sort((a, b) =>
                    a.subscriptionTier.service.name.localeCompare(
                      b.subscriptionTier.service.name,
                    ),
                  )
                  .map((service, index) => (
                    <ServiceDetailsCard
                      key={index}
                      service={{
                        id: service.subscriptionTier.service.id,
                        name: service.subscriptionTier.service.name,
                        tierName: service.subscriptionTier.name,
                        tags: service.subscriptionTier.service.tags?.map(
                          (tag) => tag.name,
                        ),
                        serviceConsumer: service,
                        refetch: () => {
                          void refetch();
                        },
                      }}
                    />
                  ))}
              </div>
            )}
        </>
    )
}