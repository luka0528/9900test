"use client"

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
export default function EndpointPage() {
  const { rawEndpointId } = useParams();
  const endpointId = rawEndpointId as string;

  const { data: endpoint } = api.endpoint.getEndpoint.useQuery({
    endpointId,
  });

  return <div>
    {JSON.stringify(endpoint)}
  </div>;
}
