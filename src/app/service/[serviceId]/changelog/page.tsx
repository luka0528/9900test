"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Loader2, AlertTriangle } from "lucide-react";
import { api } from "~/trpc/react";
import { ServiceSidebar } from "~/components/service/ServiceSidebar";
import { ChangelogSection } from "~/components/service/changelog/ChangelogSection";

export default function ServicePage() {
  const { serviceId: rawServiceId } = useParams();
  const serviceId = rawServiceId as string;
  const router = useRouter();

  const {
    data: changelogData,
    isLoading: changelogDataLoading,
    error: changelogDataError,
  } = api.service.getAllVersionChangelogs.useQuery({
    serviceId,
  });

  // Show loading state
  if (changelogDataLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (changelogDataError || !changelogData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-2xl font-bold text-destructive">
            Service not found
          </h2>
          <p className="mt-2 text-muted-foreground">
            The service you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to view it.
          </p>
          <Button className="mt-4" onClick={() => router.push("/service")}>
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <ServiceSidebar serviceId={serviceId} />
      <div className="flex h-full grow flex-col overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Changelog</h1>
          <p className="mb-6 text-muted-foreground">
            View the changelog for {changelogData.name}.
          </p>
          <Separator />
          <ChangelogSection changelogData={changelogData} />
        </div>
      </div>
    </div>
  );
}
