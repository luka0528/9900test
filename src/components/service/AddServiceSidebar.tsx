import { ChevronLeft, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/components/ui/sidebar";
import Link from "next/link";

export const AddServiceSidebar = () => {
  return (
    <div className="h-full max-w-60 border-r lg:min-w-60">
      <SidebarProvider className="items-start h-full">
        <Sidebar collapsible="none" className="hidden h-full md:flex bg-white">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/service/owned">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <ChevronLeft className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left font-semibold">
                      Your Services
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem key={"add-api-service"}>
                    <SidebarMenuButton asChild className="bg-primary/10">
                      <div>
                        <FileText />
                        <span>Add API Service</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  );
};
