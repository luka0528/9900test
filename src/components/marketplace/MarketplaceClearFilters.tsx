"use client";

import { Button } from "~/components/ui/button";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import { useTriggerFilterReset } from "~/lib/hooks/useFilterReset";

export const MarketplaceClearFilters = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Move hook to top level and store as reference
  const triggerFilterReset = useTriggerFilterReset;

  const handleRemoveFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("tags");
    params.delete("price");
    params.delete("dates");

    replace(`${pathname}?${params.toString()}`);

    // Call the function reference instead of the hook directly
    triggerFilterReset();
  };

  return (
    <div className="flex justify-end">
      <Button
        variant="link"
        size="sm"
        className="pr-4 text-xs text-muted-foreground transition-colors hover:text-foreground"
        onClick={handleRemoveFilters}
      >
        Clear
      </Button>
    </div>
  );
};
