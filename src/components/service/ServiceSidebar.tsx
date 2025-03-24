import {
  ChevronLeft,
  NotebookPen,
  MessagesSquare,
  TestTube,
  WalletCards,
} from "lucide-react";
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

// Menu items.
const items = [
  {
    title: "Details",
    url: "1",
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

export const ServiceSidebar = () => {
  return (
    <div className="h-full max-w-60 border-r lg:min-w-60">
      <SidebarProvider className="h-full items-start">
        <Sidebar collapsible="none" className="hidden h-full bg-white md:flex">
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
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <div>
                          <item.icon />
                          <span>{item.title}</span>
                        </div>
                        {/* <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a> */}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  );
};
