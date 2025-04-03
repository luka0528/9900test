"use client";

import { Separator } from "~/components/ui/separator";
import { Loader2, AlertTriangle, Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ServiceSidebar } from "~/components/service/ServiceSidebar";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { ReviewCard } from "~/components/service/ReviewCard";
import { ReviewReplyCard } from "~/components/service/ReviewReplyCard";

export default function ReviewsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const serviceId = params.serviceId as string;
  const versionId = params.versionId as string;
  const router = useRouter();

  // Fetch service data from backend
  const {
    data: service,
    isLoading: serviceLoading,
    error: serviceError,
  } = api.service.getServiceMetadataById.useQuery({ serviceId });

  // Show loading state
  if (serviceLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (serviceError || !service) {
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
      <ServiceSidebar serviceId={serviceId} versionId={versionId} />
      <div className="flex h-full grow flex-col overflow-y-auto">
        <div className="p-6">
          {/* Review information (maybe statistics on left) */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">{service.name} reviews</h1>
            <div className="flex items-center gap-2">
              {/* If the current user is subscribed to this service, their should be an add/edit review/rating button */}
              <Button className="size-min" variant="outline">
                <Pencil />
                Edit
              </Button>
            </div>
          </div>

          {/* Review cards */}
          <div className="w-full">
            <Separator className="my-6" />
            <ReviewCard />
            <Separator className="my-6" />
            <ReviewCard />
            <ReviewReplyCard />
            <Separator className="my-6" />
            <ReviewCard />
            <Separator className="my-6" />
            <ReviewCard />
          </div>
        </div>
      </div>
    </div>
  );
}
