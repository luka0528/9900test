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
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export type MarketplaceSortType = 
    "Popularity" | "Name-Asc" | "Name-Desc" | "Price-Asc" | 
    "Price-Desc" | "New-to-Old" | "Old-to-New" | "Last-Updated" | "";

export const MarketplaceSortSelector = () => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const [sort, setSort] = React.useState<MarketplaceSortType>("Popularity");

    const handleSort = (sort: MarketplaceSortType) => {
        setSort(sort);

        const params = new URLSearchParams(searchParams);
        // When the sort is 'Popularity', it is considered the default.
        if (sort === "Popularity") {
            params.delete('sort');
        } else {
            params.set('sort', sort);
        }

        replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex w-64 h-8 gap-2 ml-8">
            <div className="flex h-8 items-center">Sort by</div>
            <Select value={sort} onValueChange={v => handleSort(v as MarketplaceSortType)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select..." />
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
