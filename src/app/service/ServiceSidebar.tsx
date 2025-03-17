import {
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/components/ui/sidebar";

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
      <SidebarProvider className="items-start">
        <Sidebar collapsible="none" className="hidden md:flex">
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
