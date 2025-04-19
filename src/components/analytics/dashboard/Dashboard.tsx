"use client"

import { AnalyticsCards } from "~/components/analytics/dashboard/AnalyticsCards";
import { AnalyticsChart } from "~/components/analytics/dashboard/AnalyticsChart";
import { AnalyticsReviewSection } from "~/components/analytics/dashboard/AnalyticsReviewSection";
import { AnalyticsPieChart } from "~/components/analytics/dashboard/AnalyticsPieChart";

import { api } from "~/trpc/react";
import { AnalyticsUserNoData } from "../AnalyticsUserNoData";

export const Dashboard = () => {
    const { data: services, isLoading: servicesLoading } =
        api.analytics.getServicesByUser.useQuery();
    return (
        <>
        {servicesLoading ? (
            <></>
        ) : services && services.length === 0 ? (
            <AnalyticsUserNoData />
        ) : (
            <div className="m-4 flex h-full grow flex-col">
                <AnalyticsCards />
                <AnalyticsChart />
                <div className="flex space-x-4">
                    <AnalyticsReviewSection />
                    <AnalyticsPieChart />
                </div>
            </div>
        )}
        </>
    )
}