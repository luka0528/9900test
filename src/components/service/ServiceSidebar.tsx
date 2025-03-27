import {
  NotebookPen,
  MessagesSquare,
  TestTube,
  WalletCards,
} from "lucide-react";
import { DefaultSideBar, type SidebarItem } from "../sidebar/DefaultSideBar";

// Menu items.


export const ServiceSidebar = ({
  serviceId,
  versionId,
}: {
  serviceId: string;
  versionId: string;
}) => {
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
      url: "1",
      icon: MessagesSquare,
    },
    {
      title: "Purchase",
      url: "1",
      icon: WalletCards,
    },
  ];
  return <DefaultSideBar items={items} />;
};
