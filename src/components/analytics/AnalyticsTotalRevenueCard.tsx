"use client"

import React from 'react';
import { api } from '~/trpc/react';

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { HandCoins } from 'lucide-react';

export const AnalyticsTotalRevenueCard = () => {
    const date = new Date();
    const [currMonthQuery, prevMonthQuery] = api.useQueries(trpc => [
        trpc.analytics.getTotalRevenue({ date: new Date(date.getFullYear(), date.getMonth(), date.getDay()) }),
        trpc.analytics.getTotalRevenue({ date: new Date(date.getFullYear(), date.getMonth() - 1, date.getDay()) })
    ]);

    const {
        data: currMonthRevenue,
        isLoading: isCurrMonthLoading,
    } = currMonthQuery;

    const {
        data: prevMonthRevenue,
        isLoading: isPrevMonthLoading,
    } = prevMonthQuery;

    const revenueDelta = currMonthRevenue && prevMonthRevenue ? ((currMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

    return (
        <Card>
            <CardHeader className="relative">
                <CardDescription>Total Revenue</CardDescription>
                {isCurrMonthLoading ? (
                    <Skeleton className="h-8 mt-1 w-28" />
                ) : (
                    <CardTitle className="text-2xl font-semibold">
                        ${currMonthRevenue?.toFixed(2)}
                    </CardTitle>
                )}
                <div className="absolute right-6 top-6">
                    <HandCoins className="size-11" />
                </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
                { isPrevMonthLoading ? (
                    <Skeleton className="h-10 w-full" />
                ) : (
                    <div className="inline text-muted-foreground">
                        { revenueDelta >= 0 ? (
                            <div>
                                Up by{" "}
                                <Badge variant="outline_positive" className="inline-flex gap-1 rounded-lg text-xs mx-1">
                                    +{revenueDelta.toFixed(2)}%
                                </Badge>
                                {" "}from last month.
                            </div>
                        ) : (
                            <div>
                                Down by{" "}
                                <Badge variant="outline_negative" className="inline-flex gap-1 rounded-lg text-xs mx-1">
                                    +{revenueDelta.toFixed(2)}%
                                </Badge>
                                {" "}from last month.
                            </div>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}