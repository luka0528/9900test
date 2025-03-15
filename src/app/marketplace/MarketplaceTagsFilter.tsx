"use client"

import React from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "~/components/ui/toggle-group"


export const MarketplaceTagsFilter = () => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>([]);

    const tags = ["Transport", "Education", "Commerce", "Health", "Finance", "Entertainment", "Food", "Travel", "Sports", "Technology", "Fashion", "Art", "Music", "Science", "Environment", "Politics"];

    React.useEffect(() => {
        console.log(selectedValues);
    }, [selectedValues]);
    return (
        <div className="mt-2">
            <ToggleGroup 
                type="multiple" 
                value={selectedValues}
                onValueChange={setSelectedValues}
                className="flex flex-wrap gap-2"
            >
                {tags.map((tag) => (
                    <ToggleGroupItem key={tag} value={tag} aria-label={`Toggle ${tag}`} className="text-sm px-2 py-1 rounded-full">
                        {tag}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>
    );
}