"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Loader2 } from "lucide-react";

const ServicePage = ({ params }: { params: { serviceId: string } }) => {
  const router = useRouter();
  const { serviceId } = params;

  // 1) Fetch the service
  const {
    data: service,
    isLoading,
    error,
  } = api.service.getServiceById.useQuery(serviceId);

  // 2) Once we have the service, find the "latestVersion" and redirect
  useEffect(() => {
    if (!isLoading && service) {
      const latestVersion = service?.versions.length
        ? service.versions.reduce(
            (prev, current) =>
              new Date(current.createdAt).getTime() >
              new Date(prev?.createdAt ?? 0).getTime()
                ? current
                : prev,
            service.versions[0],
          )
        : undefined;
      if (latestVersion) {
        router.replace(`/service/${serviceId}/${latestVersion.id}`);
      }
    }
  }, [isLoading, service, serviceId, router]);

  // 3) Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto mt-12 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading service details...</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // 4) Error state
  if (error) {
    return (
      <div className="container mx-auto mt-12 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">
              Error loading service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 5) If we get here, we're done loading & no error, so we show a "Redirecting" message
  return (
    <div className="container mx-auto mt-12 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Redirecting...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            We&apos;re redirecting you to the latest version of the service.
            Please wait...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicePage;
