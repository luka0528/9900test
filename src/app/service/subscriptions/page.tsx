"use client";

import { useSession } from "next-auth/react";
import { Separator } from "~/components/ui/separator";
import { AllServiceSidebar } from "~/components/service/AllServiceSidebar";
import { ServiceUserUnauthenticated } from "~/components/service/ServiceUserUnauthenticated";
import { Loading } from "~/components/ui/loading";
import { SubscriptionPage } from "~/components/service/SubscriptionPage";

export default function ServicesPage() {
  const { status } = useSession();

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AllServiceSidebar />
      <div className="flex h-full grow flex-col">
        <div className="flex min-h-[5rem] items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Your Subscriptions</h1>
        </div>

        <Separator className="mb-6" />

        <div className="flex-1 overflow-auto p-4">
          {status === "unauthenticated" ? (
            <ServiceUserUnauthenticated />
          ) : status === "loading" ? (
            <Loading />
          ) : (
            <SubscriptionPage />
          )}
        </div>
      </div>
    </div>
  );
}
