"use client";

import React from "react";
import { api } from "~/trpc/react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { HandCoins } from "lucide-react";

export const AnalyticsTotalRevenueCard = () => {
  const date = new Date();
  const {data: revenue, isLoading} = api.analytics.getTotalRevenueOfUser.useQuery();

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
    </Card>
  );
};
