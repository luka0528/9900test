"use client";

import React from "react";
import { api } from "~/trpc/react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { HandCoins } from "lucide-react";
import { Badge } from "~/components/ui/badge";

export const AnalyticsTotalRevenueCard = () => {
  const { data: revenue, isLoading } =
    api.analytics.getTotalRevenueOfUser.useQuery();

  const { data: monthlyRevenue, isLoading: isMonthlyRevenueLoading } =
    api.analytics.getMonthlyRevenueOfUser.useQuery();

  return (
    <Card>
      <CardHeader className="relative">
        <CardDescription>Total Revenue</CardDescription>
        {isLoading ? (
          <Skeleton className="mt-1 h-8 w-28" />
        ) : (
          <CardTitle className="text-2xl font-semibold">
            ${revenue?.toFixed(2)}
          </CardTitle>
        )}
        <div className="absolute right-6 top-6">
          <HandCoins className="size-11" />
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="inline text-muted-foreground">
          <div>
                You've earned
                <Badge
                  variant="outline_positive"
                  className="mx-1 inline-flex gap-1 rounded-lg text-xs"
                >
                  ${monthlyRevenue?.toFixed(2)}
                </Badge>{""}
                so far this month.
              </div>
        </div>
      </CardFooter>
    </Card>
  );
};
