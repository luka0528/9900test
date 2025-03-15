"use client";

import React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { MarketplaceContext } from "./MarketplaceContext";

export type MarketplaceSortType = "Popularity" | "Name" | "Date-Added" | "Last-Updated";

export const MarketplaceSortSelector = () => {
    const { query, setQuery, setIsToQuery } = React.useContext(MarketplaceContext);
    const [sort, setSort] = React.useState<MarketplaceSortType>("Popularity");

    React.useEffect(() => {
        // TODO: Update the MarketplaceContext.

    }, [sort]);

    return (
        <div className="flex w-64 h-8 gap-2 ml-8">
            <div className="flex h-8 items-center">Sort by</div>
            <Select value={sort} onValueChange={v => setSort(v as MarketplaceSortType)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem value="Popularity">Popularity</SelectItem>
                    <SelectItem value="Name">Name (A-Z)</SelectItem>
                    <SelectItem value="Date-Added">Date Added</SelectItem>
                    <SelectItem value="Last-Updated">Last Updated</SelectItem>
                </SelectGroup>
            </SelectContent>
            </Select>
        </div>
    )
}
