"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { BreadCrumb } from "./BreadCrumb";
import type { BreadCrumbItem } from "./BreadCrumb";

export interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType;
}

interface SidebarProps {
  sideBarItems: SidebarItem[];
  breadCrumbItems: BreadCrumbItem[];
  baseUrl?: string;
}

export function SideBar({
  sideBarItems = [],
  breadCrumbItems = [],
  baseUrl = "",
}: SidebarProps) {
  const pathname = usePathname();
  return (
    <Sidebar
      collapsible="none"
      className={`h-full min-h-screen border-r-[2px] border-gray-200`}
    >
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <div className="mb-4">
            <BreadCrumb items={breadCrumbItems} />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {sideBarItems.map((item) => {
                const isActive = pathname === `${baseUrl}${item.url}`;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={isActive ? "bg-gray-200 dark:bg-gray-700" : ""}
                      asChild
                    >
                      <Link href={`${baseUrl}${item.url}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
