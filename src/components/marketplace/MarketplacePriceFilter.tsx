"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { DualSlider } from "~/components/ui/dual-slider";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useFilterReset } from "~/lib/hooks/useFilterReset";

export const PRICE_DEFAULT_RANGE = [0, 12];

export const MarketplacePriceFilter: React.FC = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const reset = useFilterReset();

  const [priceRange, setPriceRange] = React.useState<number[]>(
    searchParams.get("price")?.split(",").map(Number) ?? PRICE_DEFAULT_RANGE,
  );

  const handleRangeChange = (r: number[]) => {
    const r1 = r[0] ?? 0;
    const r2 = r[1] ?? 0;
    setPriceRange([r1, r2]);
  };

  const handleApplyFilter = () => {
    const params = new URLSearchParams(searchParams);

    const isDefaultRange =
      priceRange[0] === PRICE_DEFAULT_RANGE[0] &&
      priceRange[1] === PRICE_DEFAULT_RANGE[1];
    params.delete("price");
    if (!isDefaultRange) {
      priceRange.forEach((price) => {
        params.append("price", price.toString());
      });
    } else {
      params.delete("price");
    }

    replace(`${pathname}?${params.toString()}`);
  };

  React.useEffect(() => {
    setPriceRange(PRICE_DEFAULT_RANGE);
  }, [reset]);

  return (
    <div>
      <div className="mx-auto h-12 w-[80%]">
        <div className="relative mt-8 h-2 w-full">
          <div
            className="absolute -translate-y-full rounded-md border bg-background px-2 py-1 text-xs shadow-sm"
            style={{
              left: `calc(${((priceRange[0] ?? 0) / 20) * 100}% - 20px)`,
            }}
          >
            ${priceRange[0]}
          </div>
          <div
            className="absolute -translate-y-full rounded-md border bg-background px-2 py-1 text-xs shadow-sm"
            style={{
              left: `calc(${((priceRange[1] ?? 0) / 20) * 100}% - 20px)`,
            }}
          >
            ${priceRange[1]}
          </div>
        </div>
        <DualSlider
          max={20}
          defaultValue={priceRange}
          value={priceRange}
          onValueChange={(r) => handleRangeChange(r)}
        />
      </div>
      <div className="flex justify-end">
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
