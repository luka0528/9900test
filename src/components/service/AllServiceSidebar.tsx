import { ChevronRight } from "lucide-react";
import {
  DefaultSideBar,
  type SidebarItem,
} from "~/components/sidebar/DefaultSideBar";

const items: SidebarItem[] = [
  {
    title: "Your Services",
    url: "/service/owned",
    icon: ChevronRight,
  },
  {
    title: "Your Subscriptions",
    url: "/service/subscriptions",
    icon: ChevronRight,
  },
];

export const AllServiceSidebar = () => {
  return <DefaultSideBar items={items} />;
};
