"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function ServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;

  const {
    data: service,
    isLoading,
    error,
  } = api.service.getServiceById.useQuery(serviceId);

  useEffect(() => {
    if (!isLoading && service) {
      const latestVersion = service.versions.length
        ? service.versions.reduce((prev, current) =>
            new Date(current.createdAt).getTime() >
            new Date(prev.createdAt).getTime()
              ? current
              : prev,
          )
        : undefined;
      if (latestVersion) {
        router.replace(`/service/${serviceId}/${String(latestVersion.id)}`);
      }
    }
  }, [isLoading, service, serviceId, router]);

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
}
