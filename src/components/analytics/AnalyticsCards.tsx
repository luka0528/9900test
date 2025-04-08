import { AnalyticsTotalRevenueCard } from "~/components/analytics/AnalyticsTotalRevenueCard";
import { AnalyticsCustomerGrowthCard } from "~/components/analytics/AnalyticsCustomerGrowthCard";

export const AnalyticsCards = () => {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <AnalyticsTotalRevenueCard />
      <AnalyticsCustomerGrowthCard />
    </div>
  );
};
