"use client";

import React from "react";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import { useFilterReset } from "~/lib/hooks/useFilterReset";
const tagList = [
  "Transport",
  "Education",
  "Commerce",
  "Health",
  "Finance",
  "Entertainment",
  "Food",
  "Travel",
  "Sports",
  "Technology",
  "Fashion",
  "Art",
  "Music",
  "Science",
  "Environment",
  "Politics",
];

export const MarketplaceTagsFilter = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [tags, setTags] = React.useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) ?? [],
  );

  const reset = useFilterReset();

  const handleTagsChanged = (newTags: string[]) => {
    setTags(newTags);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("tags");
    newTags.forEach((tag) => {
      params.append("tags", tag);
    });
    replace(`${pathname}?${params.toString()}`);
  };

  React.useEffect(() => {
    setTags([]);
  }, [reset]);

  return (
    <div className="mt-2">
      <ToggleGroup
        type="multiple"
        value={tags}
        onValueChange={handleTagsChanged}
        className="flex flex-wrap gap-2"
      >
        {tagList.map((tag) => (
          <ToggleGroupItem
            key={tag}
            value={tag}
            aria-label={`Toggle ${tag}`}
            className="rounded-full px-2 py-1 text-sm"
          >
            {tag}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};
