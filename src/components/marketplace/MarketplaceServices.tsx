"use client";

import React from "react";
import { api } from "~/trpc/react";
import { useInView } from "react-intersection-observer";

import { MarketplaceService } from "./MarketplaceService";
import { MarketplaceServicesSkeleton } from "./MarketplaceServicesSkeleton";
import { MarketplaceServicesNoResults } from "./MarketplaceServicesNoResults";


import type { Query } from "./MarketplaceQuery";

interface MarketplaceServicesProps {
  query: Query;
}

export const MarketplaceServices = ({ query }: MarketplaceServicesProps) => {
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

  return (
    <div className="h-screen overflow-y-auto">
      {status === "pending" || status === "error" ? (
        <MarketplaceServicesSkeleton />
      ) : (
        <>
          {data.pages.map((page) => (
            <div key={page.nextCursor}>
              {page.services.length === 0 ? (
                <MarketplaceServicesNoResults />
              ) : (
                <div>
                  <div className="mt-2 grid grow grid-cols-1 gap-8 px-8 pb-8 md:grid-cols-2">
                    {page.services.map((service) => (
                      <MarketplaceService key={service.id} service={service} />
                    ))}
                  </div>
                  <button ref={ref} />
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};
