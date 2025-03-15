import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from "~/components/ui/sidebar"
   
export interface SidebarItem {
    title: string;
    url: string;
    icon: React.ComponentType;
}

interface SidebarProps {
    items: SidebarItem[];
}

export function SideBar({ items = [], label = "Sidebar", baseUrl = "" }: SidebarProps & { label?: string } & { baseUrl?: string }) {
    // Get the current pathname
    const pathname = usePathname();
    return (
        <Sidebar collapsible="none" className="h-full min-h-screen">
            <SidebarContent className="flex-1">
                <SidebarGroup>
                    <SidebarGroupLabel>{label}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                const isActive = pathname === `${baseUrl}${item.url}`;
                                // console.error(`pathname: ${pathname} === ${baseUrl}${item.url} = ${isActive}`);
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