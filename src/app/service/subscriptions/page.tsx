"use client";

import { Separator } from "~/components/ui/separator";
import { AllServiceSidebar } from "~/components/service/AllServiceSidebar";

export default function SubscriptionsPage() {
  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AllServiceSidebar />
      <div className="flex h-full grow flex-col">
        <div className="flex min-h-[5rem] items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Your Subscriptions</h1>
        </div>

        <Separator className="my-4" />

        <div>CONTENT HERE</div>
      </div>
    </div>
  );
}
