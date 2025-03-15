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

export type MarketplaceSortType = 
    "Popularity" | "Name-Asc" | "Name-Desc" | "Price-Asc" | 
    "Price-Desc" | "New-to-Old" | "Old-to-New" | "Last-Updated";

export const MarketplaceSortSelector = () => {
    const { query, setQuery, setIsToQuery } = React.useContext(MarketplaceContext);
    const [sort, setSort] = React.useState<MarketplaceSortType>("Popularity");

    React.useEffect(() => {
        setQuery({ ...query, sort });
        setIsToQuery(true);
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
                    <SelectItem value="Name-Asc">Name (A-Z)</SelectItem>
                    <SelectItem value="Name-Desc">Name (Z-A)</SelectItem>
                    <SelectItem value="Price-Asc">Price (Low-High)</SelectItem>
                    <SelectItem value="Price-Desc">Price (High-Low)</SelectItem>
                    <SelectItem value="New-to-Old">Date Added</SelectItem>
                    <SelectItem value="Last-Updated">Last Updated</SelectItem>
                </SelectGroup>
            </SelectContent>
            </Select>
        </div>
    )
}
