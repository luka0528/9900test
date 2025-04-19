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
import { UserCheck } from "lucide-react";

export const AnalyticsCustomerGrowthCard = () => {
  const { data: totalCustomers, isLoading: isTotalCustomersLoading } =
    api.analytics.getTotalCustomers.useQuery();

  const { data: mostPopularService, isLoading: isMostPopularServiceLoading } =
    api.analytics.getMostPopularService.useQuery();

  React.useEffect(() => {
    console.log("Most Popular Service: ", mostPopularService);
  }, [mostPopularService]);
  return (
    <Card>
      <CardHeader className="relative">
        <CardDescription>Customers</CardDescription>
        {isTotalCustomersLoading ? (
          <Skeleton className="mt-1 h-8 w-28" />
        ) : (
          <CardTitle className="text-2xl font-semibold">
            {totalCustomers}
          </CardTitle>
        )}
        <div className="absolute right-6 top-6">
          <UserCheck className="size-11" />
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        {isMostPopularServiceLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="inline text-muted-foreground">
            <div>
              {mostPopularService?.serviceName} leads the way, attracting
              <Badge
                variant="outline"
                className="mx-1 inline-flex gap-1 rounded-lg text-xs"
              >
                {mostPopularService?.customerCount}
              </Badge>
              customers.
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
