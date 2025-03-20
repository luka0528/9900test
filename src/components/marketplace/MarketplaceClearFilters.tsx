"use client";

import { Button } from '~/components/ui/button';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

import { useTriggerFilterReset } from '~/lib/hooks/useFilterReset';

export const MarketplaceClearFilters = () => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleRemoveFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        
        params.delete('tags');
        params.delete('price');
        params.delete('dates');
        
        replace(`${pathname}?${params.toString()}`);

        useTriggerFilterReset();
    }

    return (
        <div className="flex justify-end">
            <Button 
                variant="link" 
                size="sm" 
                className="text-xs pr-4 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleRemoveFilters}
            >
                Clear
            </Button>
        </div>
    )
}