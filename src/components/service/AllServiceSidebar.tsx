"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/components/ui/sidebar";

const items = [
  {
    title: "Your Services",
    url: "/service/services",
    icon: ChevronRight,
  },
  {
    title: "Your Subscriptions",
    url: "/service/subscriptions",
    icon: ChevronRight,
  },
];

export const AllServiceSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="h-full max-w-60 border-r lg:min-w-60">
      <SidebarProvider className="items-start">
        <Sidebar collapsible="none" className="hidden md:flex">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={isActive ? "bg-primary/10" : ""}
                        >
                          <Link href={item.url}>
                            <span>{item.title}</span>
                            <item.icon
                              className={isActive ? "text-primary" : ""}
                            />
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
      </SidebarProvider>
    </div>
  );
};
