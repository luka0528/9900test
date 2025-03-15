"use client";

import React from 'react';

import { MarketplaceContext, MarketplaceDefaultQuery } from '~/components/marketplace/MarketplaceContext';
import { MarketplaceSearch } from '~/components/marketplace/MarketplaceSearch';
import { MarketplaceSortSelector, MarketplaceSortType } from '~/components/marketplace/MarketplaceSortSelector';
import { MarketplaceServices } from '~/components/marketplace/MarketplaceServices';
import { MarketplaceSideBar, MarketplaceFilterType } from '~/components/marketplace/MarketplaceSidebar';


export interface MarketplaceQuery {
  search: string;
  sort: MarketplaceSortType;
  filters: MarketplaceFilterType;
}

export default function Marketplace() {
  const [query, setQuery] = React.useState<MarketplaceQuery>(MarketplaceDefaultQuery);
  // Acts as a signal to query the marketplace.
  const [isToQuery, setIsToQuery] = React.useState(false);

  React.useEffect(() => {
    if (isToQuery) {
      console.log('Querying:', query);
      setIsToQuery(false);
    }
  }, [isToQuery]);

  return (
    <MarketplaceContext.Provider value={{ query, setQuery, setIsToQuery }}>
      <div className="flex w-full h-full xl:max-w-[96rem]">
        <MarketplaceSideBar />
        <div className="flex flex-col grow h-full">
          <div className="flex min-h-20 justify-between items-center">
            <MarketplaceSortSelector />
            <MarketplaceSearch />
          </div>
          <MarketplaceServices />
        </div>
      </div>
    </MarketplaceContext.Provider>
  );
}
