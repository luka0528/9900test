import React from "react";
import type { MarketplaceQuery } from "~/app/marketplace/page";

const MARKETPLACE_MAX_PRICE = 20;
const MARKETPLACE_START_YEAR = 2020;

export const MarketplaceDefaultQuery: MarketplaceQuery = {
    search: "",
    sort: "Popularity",
    filters: {
        tags: [],
        price: [0, MARKETPLACE_MAX_PRICE],
        dates: Array.from(
            { length: new Date().getFullYear() - MARKETPLACE_START_YEAR + 2 },
            (_, i) => MARKETPLACE_START_YEAR + i
        ),
    },
}
    
type MarketplaceContextType = {
    query: MarketplaceQuery;
    isToQuery: boolean;
    setQuery: (query: MarketplaceQuery) => void;
    setIsToQuery: (isToQuery: boolean) => void;
};

export const MarketplaceContext = React.createContext<MarketplaceContextType>({
    query: MarketplaceDefaultQuery,
    isToQuery: false,
    setQuery: (_: MarketplaceQuery) => undefined,
    setIsToQuery: (_: boolean) => undefined,
});

