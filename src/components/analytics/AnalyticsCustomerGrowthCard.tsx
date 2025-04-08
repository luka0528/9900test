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
import { UserCheck } from 'lucide-react';


export const AnalyticsCustomerGrowthCard = () => {
  const {
    data: totalCustomers,
    isLoading: isTotalCustomersLoading,
  } = api.analytics.getTotalCustomers.useQuery();

  const {
    data: customersPerService,
    isLoading: isCustomersPerServiceLoading,
  } = api.analytics.getNumCustomersPerService.useQuery();

  // Sorts the services by customer.
  const [popularServiceName, popularServiceCount] = customersPerService 
    ? Array.from(customersPerService.entries()).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0])
    : ["", 0];

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
        {isCustomersPerServiceLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="inline text-muted-foreground">
            <div>
                {popularServiceName} leads the way, attracting
                <Badge
                    variant="outline"
                    className="mx-1 inline-flex gap-1 rounded-lg text-xs"
                >
                    {popularServiceCount}
                </Badge>
                customers.
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
