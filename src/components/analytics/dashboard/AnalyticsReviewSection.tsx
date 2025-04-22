"use client";

import { api } from "~/trpc/react";
import { AnalyticsReviewCard } from "./AnalyticsReviewCard";
import { Loading } from "~/components/ui/loading";
import { useEffect, useState } from "react";

import { useIsHalfScreen } from "~/hooks/use-half-window";

export const AnalyticsReviewSection = () => {
  const [displayCount, setDisplayCount] = useState(4);
  const { data: reviews, isLoading: isReviewsLoading } = api.analytics.getRecentCommentsByUser.useQuery({ n: displayCount });
  
  const isHalfScreen = useIsHalfScreen();

  useEffect(() => {
    if (isHalfScreen) {
      setDisplayCount(2);
    } else {
      setDisplayCount(4);
    }
  }, [isHalfScreen]);

  return (
    <div className="w-2/5 md:w-3/5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isReviewsLoading ? (
          <Loading />
        ) : reviews?.length === 0 ? (
          <div className="col-span-full">No reviews found</div>
        ) : (
          reviews?.slice(0, displayCount).map((review) => (
            <AnalyticsReviewCard key={review.id} review={review} />
          ))
        )}
      </div>
    </div>   
  );
};
