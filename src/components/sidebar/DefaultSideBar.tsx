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

interface DefaultSideBarProps {
  items: SidebarItem[];
}

export interface SidebarItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

export const DefaultSideBar = ({ items }: DefaultSideBarProps) => {
  const pathname = usePathname();

  return (
    <div className="h-full max-w-60 border-r lg:min-w-60">
      <SidebarProvider className="h-full items-start">
        <Sidebar collapsible="none" className="hidden h-full bg-white md:flex">
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
