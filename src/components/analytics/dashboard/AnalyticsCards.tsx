import { AnalyticsTotalRevenueCard } from "~/components/analytics/dashboard/AnalyticsTotalRevenueCard";
import { AnalyticsAvgRatingCard } from "~/components/analytics/dashboard/AnalyticsAvgRatingCard";
import { AnalyticsCustomerGrowthCard } from "~/components/analytics/dashboard/AnalyticsCustomerGrowthCard";

export const AnalyticsCards = () => {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <AnalyticsTotalRevenueCard />
      <AnalyticsCustomerGrowthCard />
      <AnalyticsAvgRatingCard />
    </div>
  );
};
