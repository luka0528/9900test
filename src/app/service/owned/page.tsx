"use client";

import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Loader2, Package } from "lucide-react";
import { api } from "~/trpc/react";
import { ServiceCard } from "~/components/service/ServiceCard";
import { AllServiceSidebar } from "~/components/service/AllServiceSidebar";
import { useRouter } from "next/navigation";

export default function ServicesPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const {
    data: services,
    isLoading,
    error,
  } = api.service.getAllByUserId.useQuery();

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
          >
            Add Service
          </Button>
        </div>

        <Separator className="mb-6" />

        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex h-32 w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-destructive">
              Error loading services. Please try again.
            </div>
          ) : !session ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="mb-2 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                Sign in to view your services
              </h3>
              <p className="text-muted-foreground">
                You need to be logged in to view and manage your services.
              </p>
            </div>
          ) : services?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="mb-2 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No services found</h3>
              <p className="text-muted-foreground">
                You haven&apos;t created any services yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services?.map((service, index) => (
                <ServiceCard
                  key={index}
                  service={{
                    id: service.id,
                    name: service.name,
                    owner: service.owner ?? "No Name",
                    tags: service.tags,
                    latestVersionId: service.latestVersion.id,
                    latestVersion: service.latestVersion.version,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
