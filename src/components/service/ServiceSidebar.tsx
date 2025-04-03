"use client";

import {
  NotebookPen,
  MessagesSquare,
  TestTube,
  WalletCards,
  PlusCircle,
  FileClock,
} from "lucide-react";
import { DefaultSideBar, type SidebarItem } from "../sidebar/DefaultSideBar";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";

export function ServiceSidebar({
  serviceId,
}: {
  serviceId: string;
}) {
  const { data: session } = useSession();
  const { data: service } = api.service.getServiceById.useQuery(serviceId);
  const isOwner = service?.owners.some(
    (owner) => owner.user.id === session?.user.id,
  );

  const items: SidebarItem[] = [
    {
      title: "Details",
      url: `/service/${serviceId}`,
      icon: NotebookPen,
    },
    {
      title: "Test Service",
      url: "1",
      icon: TestTube,
    },
    {
      title: "Reviews",
      url: "1",
      icon: MessagesSquare,
    },
    {
      title: "Purchase",
      url: "1",
      icon: WalletCards,
    },
    {
      title: "Changelog",
      url: `/service/${serviceId}/changelog`,
      icon: FileClock,
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
