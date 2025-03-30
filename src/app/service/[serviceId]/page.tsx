import { db } from "~/server/db";
import { redirect } from "next/navigation";

export default async function ServicePage({
  params,
}: {
  params: { serviceId: string };
}) {
  const { serviceId } = params;

  const service = await db.service.findUnique({
    where: {
      id: serviceId,
    },
    select: {
      versions: {
        select: {
          id: true,
        },
        orderBy: {
          version: "desc",
        },
        take: 1,
      },
    },
  });

  if (!service) {
    return <div>Service not found</div>;
  }

  return redirect(`/service/${serviceId}/${service.versions[0]?.id}`);
}
