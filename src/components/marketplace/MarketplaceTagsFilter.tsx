"use client"

import React from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "~/components/ui/toggle-group"
import { MarketplaceContext } from "./MarketplaceContext";

const tagList = ["Transport", "Education", "Commerce", "Health", "Finance", "Entertainment", "Food", "Travel", "Sports", "Technology", "Fashion", "Art", "Music", "Science", "Environment", "Politics"];

interface MarketplaceTagsFilterProps {
    opened: boolean;
}

export const MarketplaceTagsFilter = ({ opened }: MarketplaceTagsFilterProps) => {
    const { query, setQuery, setIsToQuery } = React.useContext(MarketplaceContext);
    const [tags, setTags] = React.useState<string[]>([]);
    const [isOpened, setIsOpened] = React.useState(opened);

    React.useEffect(() => {
        // Prevents refetching when the component mounts
        if (isOpened) {
            setIsOpened(false);
            return;
        }

        setQuery({
            ...query,
            filters: {
                ...query.filters,
                tags
            }
        });

        setIsToQuery(true);
    }, [tags]);

    return (
        <div className="mt-2">
            <ToggleGroup 
                type="multiple" 
                value={tags}
                onValueChange={setTags}
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