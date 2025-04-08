"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardDescription } from "~/components/ui/card"
import { Star } from "lucide-react"

import { api } from "~/trpc/react"
import { Skeleton } from "~/components/ui/skeleton"
import { StarRating } from "~/components/ui/stars"


const MAX_RATING = 5

export const AnalyticsAvgRatingCard = () => {
  const {
    data: avgRating,
    isLoading,
  } = api.analytics.getAvgRating.useQuery()

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="">
        <CardDescription>Average Rating</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        {isLoading ? (
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-48" />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <StarRating rating={avgRating!}/>
          </div>
        )}
        <div className="flex items-center justify-center gap-1 pl-4">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-3xl font-bold">{avgRating?.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground self-end mb-1">/{MAX_RATING}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
