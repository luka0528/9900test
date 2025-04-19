"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "~/components/ui/card";

import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import { StarRating } from "~/components/ui/stars";

const MAX_RATING = 5;

export const AnalyticsAvgRatingCard = () => {
  const { data: avgRating, isLoading } = api.analytics.getAverageRating.useQuery();

  return (
    <Card>
      <CardHeader className="">
        <CardDescription>Average Rating</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        {isLoading ? (
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-48" />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <StarRating rating={avgRating!} />
          </div>
        )}
        <div className="flex items-center justify-center gap-1 pl-4">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-3xl font-bold">{avgRating?.toFixed(1)}</p>
              <p className="mb-1 self-end text-sm text-muted-foreground">
                /{MAX_RATING}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
