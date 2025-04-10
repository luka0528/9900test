"use client";

import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

export const AnalyticsReviewSection = () => {
  return (
    <div className="flex w-2/3 space-x-4">
      <div className="w-1/2 space-y-4 pt-0">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-[130px]" />
              </div>
            </div>
            <div className="cursor-pointer text-gray-400 hover:text-gray-600">
              <ExternalLink size={18} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-[130px]" />
              </div>
            </div>
            <div className="cursor-pointer text-gray-400 hover:text-gray-600">
              <ExternalLink size={18} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-[130px]" />
              </div>
            </div>
            <div className="cursor-pointer text-gray-400 hover:text-gray-600">
              <ExternalLink size={18} />
            </div>
          </div>
        </Card>
      </div>
      <div className="w-1/2 space-y-4 pt-0">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-[130px]" />
              </div>
            </div>
            <div className="cursor-pointer text-gray-400 hover:text-gray-600">
              <ExternalLink size={18} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-[130px]" />
              </div>
            </div>
            <div className="cursor-pointer text-gray-400 hover:text-gray-600">
              <ExternalLink size={18} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-3 w-[130px]" />
              </div>
            </div>
            <div className="cursor-pointer text-gray-400 hover:text-gray-600">
              <ExternalLink size={18} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
