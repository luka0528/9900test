"use client";

import React from "react"
import { Search } from 'lucide-react';

import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { MarketplaceContext } from "./MarketplaceContext";

export const MarketplaceSearch = () => {
    const { query, setQuery, setIsToQuery } = React.useContext(MarketplaceContext);
    const [search, setSearch] = React.useState("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmitSearch();
            e.preventDefault();
        }
    }

    const handleSubmitSearch = () => {
        setQuery({ ...query, search });
        setIsToQuery(true);
    }

    // Placing the Search icon within the input https://github.com/shadcn-ui/ui/discussions/1552
    return (
        <div className="relative w-80 mr-12">
            <div className="flex w-full max-w-sm items-center justify-between space-x-2">
            <div>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                className="w-full pl-10"
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e)}
                />
            </div>
            <Button type="button" className="grow" onClick={handleSubmitSearch}>Search</Button>
            </div>
        </div>
    );
}
