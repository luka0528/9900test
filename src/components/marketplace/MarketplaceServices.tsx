"use client";

import React from "react"
import { api } from "~/trpc/react";
import { useInView } from "react-intersection-observer";

import { MarketplaceService } from "./MarketplaceService";
import { MarketplaceContext } from "./MarketplaceContext";

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
    description: "A utility-first CSS framework for rapidly building custom user interfaces.",
    version: "3.3.5",
    stats: {
      downloads: "4.8M/week",
      stars: 73000,
    },
    creator: { name: "Adam Wathan", url: "https://github.com/adamwathan" },
    lastUpdated: "2023-11-10",
    license: "MIT",
    price: 10.00,
    keywords: ["css", "tailwind", "utility", "responsive"],
  },
  {
    name: "shadcn-ui",
    description: "Beautifully designed components built with Radix UI and Tailwind CSS.",
    version: "0.4.1",
    stats: {
      downloads: "950K/week",
      stars: 45000,
    },
    creator: { name: "shadcn", url: "https://github.com/shadcn" },
    lastUpdated: "2023-11-25",
    license: "MIT",
    price: 8.00,
    keywords: ["ui", "components", "radix", "tailwind"],
  },
];

export const MarketplaceServices = () => {
    const { query, isToQuery, setIsToQuery } = React.useContext(MarketplaceContext);
    const [ref, inView] = useInView();

    // The API call will refetch when the query changes, hence there is a need
    // to finalise the query before making the API call.
    const [finalQuery, setFinalQuery] = React.useState(query);

    // The Marketplace is unidirection, so we only req. the fields related
    // to the 'next' page.
    const { 
        status,
        data,
        error,
        fetchNextPage,
    } = api.service.getInfiniteServices.useInfiniteQuery(
        {
            query: finalQuery,
        },
        {
            getNextPageParam: (page) => page.nextCursor,
        }
    );

    React.useEffect(() => {
      if (isToQuery) {
        console.log('Querying:', query);
        setFinalQuery(query);
        setIsToQuery(false);
      }
    }, [isToQuery]);

    React.useEffect(() => {
        if (inView) {
          fetchNextPage();
        }
    }, [fetchNextPage, inView]);

    return (
        <div className="h-screen overflow-y-auto">
            {/* TODO: Nicer skeleton page for no results & loading */}
            {status === 'pending' ? (
                <p>Loading...</p>
            ) : status === 'error' ? (
                <span>Error: {error.message}</span>
            ) : (
                <>
                    {data.pages.map((page) => (
                        <div className="grid grid-cols-1 md:grid-cols-2 grow px-8 pb-8 gap-8" key={page.nextCursor}>
                            {page.services.map((service, index) => (
                                <MarketplaceService key={service.id} service={packages[index % packages.length] || undefined}  />
                            ))}
                        </div>
                    ))}
                    <button
                        ref={ref}
                    />
                </>
            )}
        </div>
    );
}
