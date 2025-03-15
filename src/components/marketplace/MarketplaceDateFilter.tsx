"use client"

import React from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";

// The set of dates to filter by
const startYear = 2020;
const numberOfYears = 6;
const dates = Array.from({ length: numberOfYears }, (_, index) => ({
    from: startYear + index,
    to: startYear + index + 1,
}));

export const MarketplaceDateFilter = () => {
    const [selectedDates, setSelectedDates] = React.useState<Map<number, boolean>>(new Map());
    const toggleDate = (index: number) => {
        setSelectedDates((prev) => {
            prev.set(index, !prev.get(index))
            return new Map(prev)
        })
    }

    React.useEffect(() => {
        // TODO: Add to MarketplaceContext
        console.log(selectedDates)
    }, [selectedDates])
    
    return (
        <div>
            <div className="space-y-3">
                {dates.map((date, idx) => (
                    <div key={idx} className="items-top flex space-x-2">
                        <Checkbox
                            onCheckedChange={() => toggleDate(date.from)} 
                        />
                        <div className="grid gap-1.5 leading-none">
                        <label
                            className="text-sm"
                        >
                            {date.from} - {date.to}
                        </label>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex mt-4 justify-end">
                <Button size="sm" variant="outline" className="w-full text-sm">Go</Button>
            </div>
        </div>
    )
}