import { AnalyticsSideBar } from "~/components/analytics/AnalyticsSideBar";
import { AnalyticsCards } from "~/components/analytics/AnalyticsCards";
import { AnalyticsChart } from "~/components/analytics/AnalyticsChart";
import { AnalyticsReviewSection } from "~/components/analytics/AnalyticsReviewSection";
import { AnalyticsPieChart } from "~/components/analytics/AnalyticsPieChart";

export default function Analytics() {
  return (
    <div className="flex h-full w-full xl:max-w-[96rem] overflow-hidden">
      <AnalyticsSideBar />
      <div className="flex h-full grow flex-col m-4">
        <AnalyticsCards />
        <AnalyticsChart />
        <div className="flex space-x-4">
          <AnalyticsReviewSection />
          <AnalyticsPieChart />
        </div>
      </div>
    </div>
  );
}
