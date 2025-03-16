"use client"

import React from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "~/components/ui/toggle-group"
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

const tagList = ["Transport", "Education", "Commerce", "Health", "Finance", "Entertainment", "Food", "Travel", "Sports", "Technology", "Fashion", "Art", "Music", "Science", "Environment", "Politics"];

export const MarketplaceTagsFilter = () => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const [tags, setTags] = React.useState<string[]>(
        searchParams.get('tags')?.split(',').filter(Boolean) || []
    );

    const handleTagsChanged = (newTags: string[]) => {
        setTags(newTags);

        const params = new URLSearchParams(searchParams.toString());
        if (newTags.length > 0) {
            params.set('tags', newTags.join(','));
        } else {
            params.delete('tags');
        }
        
        replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="mt-2">
            <ToggleGroup 
                type="multiple" 
                value={tags}
                onValueChange={handleTagsChanged}
                className="flex flex-wrap gap-2"
            >
                {tagList.map((tag) => (
                    <ToggleGroupItem key={tag} value={tag} aria-label={`Toggle ${tag}`} className="text-sm px-2 py-1 rounded-full">
                        {tag}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>
    );
}