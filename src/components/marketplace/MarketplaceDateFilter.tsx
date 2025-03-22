"use client";

import React from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useFilterReset } from "~/lib/hooks/useFilterReset";

// The set of dates to filter by
const startYear = 2020;
const numberOfYears = 6;
const dates = Array.from({ length: numberOfYears }, (_, index) => ({
  from: startYear + index,
  to: startYear + index + 1,
}));

export const MarketplaceDateFilter = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const reset = useFilterReset();

  const [selectedDates, setSelectedDates] = React.useState<Set<number>>(
    new Set(searchParams.get("dates")?.split(",").map(Number) ?? []),
  );
  const toggleYear = (year: number) => {
    setSelectedDates((prev) => {
      const newSet = new Set(prev);
      if (prev.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }

      return newSet;
    });
  };

  const handleApplyFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("dates");
    selectedDates.forEach((date) => {
      params.append("dates", date.toString());
    });
    replace(`${pathname}?${params.toString()}`);
  };

  React.useEffect(() => {
    setSelectedDates(new Set());
  }, [reset]);

  return (
    <div>
      <div className="space-y-3">
        {dates.map((date, idx) => (
          <div key={idx} className="items-top flex space-x-2">
            <Checkbox
              checked={selectedDates.has(date.from)}
              onCheckedChange={() => toggleYear(date.from)}
            />
            <div className="grid gap-1.5 leading-none">
              <label className="text-sm">
                {date.from} - {date.to}
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="w-full text-sm"
          onClick={() => handleApplyFilter()}
        >
          Go
        </Button>
      </div>
    </div>
  );
};
