"use client";

import { useSession } from "next-auth/react";

import { AnalyticsSideBar } from "~/components/analytics/AnalyticsSideBar";
import { AnalyticsCards } from "~/components/analytics/AnalyticsCards";
import { AnalyticsChart } from "~/components/analytics/AnalyticsChart";
import { AnalyticsReviewSection } from "~/components/analytics/AnalyticsReviewSection";
import { AnalyticsPieChart } from "~/components/analytics/AnalyticsPieChart";
import { AnalyticsUserUnauthenticated } from "~/components/analytics/AnalyticsUserUnauthenticated";

import { Loader2 } from "lucide-react";

export default function Analytics() {
  const { status } = useSession();

  return (
    <>
      {status === "unauthenticated" ? (
        <AnalyticsUserUnauthenticated />
      ) : status === "loading" ? (
        <div className="flex h-full w-full items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="flex h-full w-full overflow-hidden xl:max-w-[96rem]">
          <AnalyticsSideBar />
          <div className="m-4 flex h-full grow flex-col">
            <AnalyticsCards />
            <AnalyticsChart />
            <div className="flex space-x-4">
              <AnalyticsReviewSection />
              <AnalyticsPieChart />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
