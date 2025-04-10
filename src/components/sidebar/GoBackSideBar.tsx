"use client";

import { ChevronLeft } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/components/ui/sidebar";

export function GoBackSideBar() {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="h-full max-w-60 border-r lg:min-w-60">
      <SidebarProvider className="h-full items-start">
        <Sidebar collapsible="none" className="hidden h-full md:flex">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" onClick={handleGoBack}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <ChevronLeft className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left font-semibold">
                    Go Back
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}
