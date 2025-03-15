"use client"

import React from "react";
import { Button } from "~/components/ui/button";
import { DualSlider } from "~/components/ui/dual-slider";

export const MarketplacePriceFilter: React.FC = () => {
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 12]);

  const handleRangeChange = (r: number[]) => {
    const r1 = r[0] || 0
    const r2 = r[1] || 0
    setPriceRange([r1, r2])
  }
  
  return (
      <div>
        <div className="w-[80%] mx-auto h-12">
            <div className="relative w-full h-2 mt-8">
                <div 
                  className="absolute text-xs px-2 py-1 bg-background border rounded-md shadow-sm -translate-y-full"
                  style={{ 
                    left: `calc(${priceRange[0] / 20 * 100}% - 20px)`
                  }}
                >
                  ${priceRange[0]}
                </div>
                <div 
                    className="absolute text-xs px-2 py-1 bg-background border rounded-md shadow-sm -translate-y-full"
                    style={{ 
                        left: `calc(${priceRange[1] / 20 * 100}% - 20px)`,
                    }}
                >   
                    ${priceRange[1]}
                </div>
            </div>
            <DualSlider max={20} defaultValue={priceRange} value={priceRange} onValueChange={r => handleRangeChange(r)} />
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="w-full text-sm">Go</Button>
        </div>
      </div>
  );
};
