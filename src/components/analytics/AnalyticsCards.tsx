import { AnalyticsTotalRevenueCard } from "~/components/analytics/AnalyticsTotalRevenueCard";
import { AnalyticsAvgRatingCard } from "~/components/analytics/AnalyticsAvgRatingCard";

export const AnalyticsCards = () => {
  return (
    <div className="m-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
      <AnalyticsTotalRevenueCard />
      <AnalyticsAvgRatingCard />
    </div>
  );
};
