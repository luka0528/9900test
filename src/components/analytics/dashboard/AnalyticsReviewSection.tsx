"use client";

import { api } from "~/trpc/react";
import { AnalyticsReviewCard } from "./AnalyticsReviewCard";
import { Loading } from "~/components/ui/loading";

export const AnalyticsReviewSection = () => {
  const { data: reviews, isLoading: isReviewsLoading } = api.analytics.getRecentCommentsByUser.useQuery({ n: 3 });

  return (
    <div className="w-3/5 space-x-4 flex">
      <div className="grid grid-cols-1 lg:grid-cols-2 grid-rows-2 gap-2">
      {isReviewsLoading ? (
        <Loading />
      ) : reviews?.length === 0 ? (
        <div>No reviews found</div>
      ) : (
        reviews?.map((review) => (
          <AnalyticsReviewCard key={review.id} review={review} />
        ))
      )}
      </div>
    </div>   
  );
};
