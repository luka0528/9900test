"use client";

import React from "react";
import { api } from "~/trpc/react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { HandCoins } from "lucide-react";

export const AnalyticsMonthlyRevenueCard = () => {
  const { data: monthlyRevenueThisMonth, isLoading: isMonthlyRevenueThisMonthLoading } =
    api.analytics.getTotalRevenueOfUser.useQuery();
  const { data: monthlyRevenueLastMonth, isLoading: isMonthlyRevenueLastMonthLoading } =
    api.analytics.getTotalRevenueOfUser.useQuery();

  return (
    <Card>
      <CardHeader className="relative">
        <CardDescription>Monthly Revenue</CardDescription>
        {isMonthlyRevenueThisMonthLoading ? (
          <Skeleton className="mt-1 h-8 w-28" />
        ) : (
          <CardTitle className="text-2xl font-semibold">
            ${monthlyRevenueThisMonth?.toFixed(2)}
          </CardTitle>
        )}
        <div className="absolute right-6 top-6">
          <HandCoins className="size-11" />
        </div>
      </CardHeader>
    </Card>
  );
};
