"use client";

import { useSession } from "next-auth/react";

import { AnalyticsSideBar } from "~/components/analytics/AnalyticsSideBar";
import { AnalyticsUserUnauthenticated } from "~/components/analytics/AnalyticsUserUnauthenticated";

import { Loading } from "~/components/ui/loading";
import { Dashboard } from "~/components/analytics/dashboard/Dashboard";

export default function Analytics() {
  const { status } = useSession();

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AnalyticsSideBar />
      {status === "unauthenticated" ? (
        <AnalyticsUserUnauthenticated />
      ) : status === "loading" ? (
        <Loading />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}
