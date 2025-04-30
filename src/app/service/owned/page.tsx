"use client";

import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

import { AllServiceSidebar } from "~/components/service/AllServiceSidebar";
import { useRouter } from "next/navigation";
import { ServiceUserUnauthenticated } from "~/components/service/ServiceUserUnauthenticated";
import { ServicePage } from "~/components/service/ServicePage";
import { Loading } from "~/components/ui/loading";

export default function ServicesPage() {
  const { status } = useSession();
  const router = useRouter();

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AllServiceSidebar />
      <div className="flex h-full grow flex-col">
        <div className="flex min-h-[5rem] items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Your Services</h1>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              router.push("/service/add");
            }}
            disabled={status !== "authenticated"}
          >
            Add Service
          </Button>
        </div>

        <Separator className="mb-6" />
        {status === "unauthenticated" ? (
          <ServiceUserUnauthenticated />
        ) : status === "loading" ? (
          <Loading />
        ) : (
          <ServicePage />
        )}
      </div>
    </div>
  );
}
