"use client";

import { useSession } from "next-auth/react";

import { AnalyticsUserUnauthenticated } from "~/components/analytics/AnalyticsUserUnauthenticated";
import { AnalyticsSideBar } from "~/components/analytics/AnalyticsSideBar";
import { Loading } from "~/components/ui/loading";
import { ServiceTable } from "~/components/analytics/ServiceTable";

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
        <ServiceTable />
      )}
    </div>
  );
}
