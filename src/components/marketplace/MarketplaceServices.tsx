"use client";

import React from "react";
import { api } from "~/trpc/react";
import { useInView } from "react-intersection-observer";
import { useRouter, useSearchParams } from "next/navigation";
import { MarketplaceService } from "./MarketplaceService";
import { MarketplaceServicesSkeleton } from "./MarketplaceServicesSkeleton";
import { MarketplaceServicesNoResults } from "./MarketplaceServicesNoResults";

import type { Query } from "./MarketplaceQuery";

interface MarketplaceServicesProps {
  query: Query;
}

export const MarketplaceServices = ({ query }: MarketplaceServicesProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ref, inView] = useInView();

  // The Marketplace is unidirection, so we only req. the fields related
  // to the 'next' page.
  const { status, data, fetchNextPage } =
    api.service.getServiceByQuery.useInfiniteQuery(
      {
        search: query.search,
        tags: query.tags,
        sort: query.sort,
        price: query.price,
        dates: query.dates,
        limit: 12,
      },
      {
        getNextPageParam: (page) => page.nextCursor,
      },
    );

  React.useEffect(() => {
    if (inView) {
      void fetchNextPage();
    }
  }, [fetchNextPage, inView]);

  const handleServiceClick = (serviceId: string, latestVersionId: string) => {
    const currentParams = searchParams.toString();
    // Add fromMarketplace flag to the URL
    const queryString = currentParams
      ? `${currentParams}&fromMarketplace=true`
      : "fromMarketplace=true";
    router.push(`/service/${serviceId}/${latestVersionId}?${queryString}`);
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      {status === "pending" || status === "error" ? (
        <MarketplaceServicesSkeleton />
      ) : (
        <>
          {data.pages.map((page) => (
            <div key={page.nextCursor ?? "no-cursor"}>
              {page.services.length === 0 ? (
                <MarketplaceServicesNoResults />
              ) : (
                <div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {page.services.map((service) => (
                      <div key={service.id} className="h-full">
                        <MarketplaceService
                          service={{
                            ...service,
                            subscriptionTiers: service.subscriptionTiers || [],
                          }}
                          onClick={() =>
                            handleServiceClick(
                              service.id,
                              service.versions[0]?.id ?? "",
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div ref={ref} className="h-4" />
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};
