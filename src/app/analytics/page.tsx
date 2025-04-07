import { AnalyticsSideBar } from "~/components/analytics/AnalyticsSideBar";
import { AnalyticsCards } from "~/components/analytics/AnalyticsCards";
import { AnalyticsChart } from "~/components/analytics/AnalyticsChart";
import { AnalyticsReviewSection } from "~/components/analytics/AnalyticsReviewSection";
import { AnalyticsPieChart } from "~/components/analytics/AnalyticsPieChart";

export default function Analytics() {
    return (
        <div className="flex w-full h-full xl:max-w-[96rem]">
            <AnalyticsSideBar />
            <div className="flex flex-col grow h-full">
                <AnalyticsCards />
                <AnalyticsChart />
                <div className="flex m-4 space-x-4">
                    <AnalyticsReviewSection />
                    <AnalyticsPieChart />
                </div>
            </div>
        </div>
    );
}
