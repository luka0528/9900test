import React from "react";
import { MarketplaceQuery } from "~/app/marketplace/page";

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
    
export const MarketplaceContext = React.createContext({
    query: MarketplaceDefaultQuery,
    setQuery: (_query: MarketplaceQuery) => {},
    setIsToQuery: (_isToQuery: boolean) => {},
});

