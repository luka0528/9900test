"use client";

import React from "react";
import { api } from "~/trpc/react";
import { useInView } from "react-intersection-observer";

import { MarketplaceService } from "./MarketplaceService";
import { MarketplaceServicesSkeleton } from "./MarketplaceServicesSkeleton";
import { MarketplaceServicesNoResults } from "./MarketplaceServicesNoResults";

import { Loader2 } from "lucide-react";

import type { Query } from "./MarketplaceQuery";

interface MarketplaceServicesProps {
  query: Query;
}

export const MarketplaceServices = ({ query }: MarketplaceServicesProps) => {
  const [ref, inView] = useInView({
    threshold: 0,
    rootMargin: "100px", // Load a bit before reaching the actual bottom
  });

    // The Marketplace is unidirection, so we only req. the fields related
    // to the 'next' page.
    const { 
        status,
        data,
        fetchNextPage,
    } = api.service.getServiceByQuery.useInfiniteQuery(
        {
            search: query.search,
            tags: query.tags,
            sort: query.sort,
            price: query.price,
            dates: query.dates,
            limit: 12 
        },
        {
            getNextPageParam: (page) => page.nextCursor,
        }
    );

  React.useEffect(() => {
    if (inView) {
      void fetchNextPage();
    }
  }, [fetchNextPage, inView]);

    return (
        <div className="h-screen overflow-y-auto">
            {status === 'pending' || status === 'error' ? (
                <MarketplaceServicesSkeleton />
            ) : (
                <>
                    {data.pages.map((page) => (
                        <div key={page.nextCursor}>
                          {page.services.length === 0 ? (
                            <MarketplaceServicesNoResults />
                          ) : (
                            <div>
                              <div className="grid grid-cols-1 md:grid-cols-2 grow px-8 pb-8 gap-8">
                                {page.services.map((service, index) => (
                                  <MarketplaceService key={service.id} service={
                                    {
                                      name: service.name,
                                      description: "Beautifully designed components built with Radix UI and Tailwind CSS.",
                                      version: "0.4.1",
                                      stats: {
                                        downloads: "950K/week",
                                        stars: 45000,
                                      },
                                      creator: { name: "shadcn", url: "https://github.com/shadcn" },
                                      lastUpdated: service.updatedAt.toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      }),
                                      license: "MIT",
                                      price: service.price ?? 0,
                                      keywords: ["ui", "components", "radix", "tailwind"],
                                    }
                                  } />
                                ))}
                              </div>
                              <button
                                ref={ref}
                              />
                            </div>
                          )}
                        </div>
                    ))}   
                </>
            )}
        </div>
    );
}
