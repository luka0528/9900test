"use client";

import { api } from "~/trpc/react";
import { useParams, redirect } from "next/navigation";
export default function ServicePage() {
  const { serviceId: rawServiceId } = useParams();
  const serviceId = rawServiceId as string;

  const { data: service } = api.service.getServiceMetadataById.useQuery({
    serviceId,
  });

  if (!service) {
    return <div>Service not found</div>;
  }

  return redirect(`/service/${serviceId}/${service.versions[0]?.id}`);
}
