"use client";

import React from "react";
import { api } from "~/trpc/react";
import { useInView } from "react-intersection-observer";

import { MarketplaceService } from "./MarketplaceService";
import { MarketplaceServicesSkeleton } from "./MarketplaceServicesSkeleton";
import { MarketplaceServicesNoResults } from "./MarketplaceServicesNoResults";

import { Loader2 } from "lucide-react";

import type { Query } from "./MarketplaceQuery";
// Mock data for the Marketplace -- cannot use the data from the API
// as the schema is very limited.
const packages = [
  {
    name: "react",
    description: "React is a JavaScript library for building user interfaces.",
    version: "18.2.0",
    stats: {
      downloads: "20M/week",
      stars: 213000,
    },
    creator: { name: "Meta Open Source", url: "https://github.com/facebook" },
    lastUpdated: "2023-10-15",
    license: "MIT",
    price: 0.0,
    keywords: ["react", "javascript", "library", "ui"],
  },
  {
    name: "next",
    description: "The React Framework for the Web",
    version: "14.0.3",
    stats: {
      downloads: "5.2M/week",
      stars: 114000,
    },
    creator: { name: "Vercel", url: "https://github.com/vercel" },
    lastUpdated: "2023-11-20",
    license: "MIT",
    price: 15.99,
    keywords: ["react", "nextjs", "framework", "ssr"],
  },
  {
    name: "tailwindcss",
    description:
      "A utility-first CSS framework for rapidly building custom user interfaces.",
    version: "3.3.5",
    stats: {
      downloads: "4.8M/week",
      stars: 73000,
    },
    creator: { name: "Adam Wathan", url: "https://github.com/adamwathan" },
    lastUpdated: "2023-11-10",
    license: "MIT",
    price: 10.0,
    keywords: ["css", "tailwind", "utility", "responsive"],
  },
  {
    name: "shadcn-ui",
    description:
      "Beautifully designed components built with Radix UI and Tailwind CSS.",
    version: "0.4.1",
    stats: {
      downloads: "950K/week",
      stars: 45000,
    },
    creator: { name: "shadcn", url: "https://github.com/shadcn" },
    lastUpdated: "2023-11-25",
    license: "MIT",
    price: 8.0,
    keywords: ["ui", "components", "radix", "tailwind"],
  },
];

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
  const { status, data, fetchNextPage } =
    api.service.getInfiniteServices.useInfiniteQuery(
      {
        query,
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
    <div className="h-screen overflow-y-auto pt-2">
      {status === "pending" || status === "error" ? (
        <MarketplaceServicesSkeleton />
      ) : (
        <>
          {data.pages.map((page) => (
            <div key={page.nextCursor}>
              {page.services.length === 0 ? (
                <MarketplaceServicesNoResults />
              ) : (
                <div className="grid grow grid-cols-1 gap-8 px-8 pb-8 md:grid-cols-2">
                  {page.services.map((service, index) => (
                    <MarketplaceService
                      key={service.id}
                      service={packages[index % packages.length] ?? undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {/* Bottom loader reference - only visible when there might be more content */}
          {data.pages[data.pages.length - 1]?.nextCursor && (
            <div className="flex justify-center py-4" ref={ref}>
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
};
