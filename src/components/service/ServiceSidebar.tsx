"use client";

import {
  NotebookPen,
  MessagesSquare,
  TestTube,
  WalletCards,
  PlusCircle,
} from "lucide-react";
import { DefaultSideBar, type SidebarItem } from "../sidebar/DefaultSideBar";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";

export function ServiceSidebar({
  serviceId,
  versionId,
}: {
  serviceId: string;
  versionId: string;
}) {
  const { data: session } = useSession();
  const { data: service } = api.service.getServiceById.useQuery(serviceId);
  const isOwner = service?.owners.some(
    (owner) => owner.user.id === session?.user.id,
  );

  const items: SidebarItem[] = [
    {
      title: "Details",
      url: `/service/${serviceId}/${versionId}`,
      icon: NotebookPen,
    },
    {
      title: "Test Service",
      url: "1",
      icon: TestTube,
    },
    {
      title: "Reviews",
      url: `/service/${serviceId}/reviews`,
      icon: MessagesSquare,
    },
    {
      title: "Purchase",
      url: "1",
      icon: WalletCards,
    },
    ...(isOwner
      ? [
          {
            title: "Add Version",
            url: `/service/${serviceId}/add-version`,
            icon: PlusCircle,
          },
        ]
      : []),
  ];
  return <DefaultSideBar items={items} />;
}
