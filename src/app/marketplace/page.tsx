import React, { Suspense } from "react";

import { MarketplaceSearch } from "~/components/marketplace/MarketplaceSearch";
import { MarketplaceSortSelector } from "~/components/marketplace/MarketplaceSortSelector";
import { MarketplaceServices } from "~/components/marketplace/MarketplaceServices";
import { MarketplaceSideBar } from "~/components/marketplace/MarketplaceSidebar";

import { MarketplaceServicesSkeleton } from "~/components/marketplace/MarketplaceServicesSkeleton";
import { DEFAULT_QUERY } from "~/components/marketplace/MarketplaceQuery";

import type { Query } from "~/components/marketplace/MarketplaceQuery";

interface MarketplaceProps {
  searchParams?: Promise<Query>;
}

export default async function Marketplace(props: MarketplaceProps) {
  const query = (await props.searchParams) ?? DEFAULT_QUERY;

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <MarketplaceSideBar />
      <div className="flex h-full grow flex-col">
        <div className="flex min-h-20 items-center justify-between">
          <MarketplaceSortSelector />
          <MarketplaceSearch />
        </div>
        <Suspense fallback={<MarketplaceServicesSkeleton />}>
          <MarketplaceServices query={query} />
        </Suspense>
      </div>
    </div>
  );
}
