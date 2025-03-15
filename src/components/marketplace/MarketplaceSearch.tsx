"use client";

import React from "react"
import { Search } from 'lucide-react';

import { Input } from "~/components/ui/input"
import { useDebounce } from "~/lib/hooks/useDebounce"
import { MarketplaceContext } from "./MarketplaceContext";

export const MarketplaceSearch = () => {
    const { query, setQuery, setIsToQuery } = React.useContext(MarketplaceContext);
    const [search, setSearch] = React.useState("");
    const debounceSearch = useDebounce(search, 1000);

    React.useEffect(() => {
        setQuery({ ...query, search: debounceSearch });
        setIsToQuery(true);
    }, [debounceSearch]);

    // Placing the Search icon within the input https://github.com/shadcn-ui/ui/discussions/1552
    return (
        <div className="relative w-60 mr-12">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
                className="w-full pl-10"
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
    );
}
