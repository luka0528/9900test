"use client";

import { TableProperties, LayoutDashboard } from "lucide-react";
import {
  DefaultSideBar,
  type SidebarItem,
} from "~/components/sidebar/DefaultSideBar";

const items: SidebarItem[] = [
  {
    title: "Dashboard",
    url: "/analytics",
    icon: LayoutDashboard,
  },
  {
    title: "Services Table",
    url: "/analytics/services",
    icon: TableProperties,
  },
];

export const AnalyticsSideBar = () => {
  return <DefaultSideBar items={items} />;
};

