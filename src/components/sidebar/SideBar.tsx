"use client";
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
} from "~/components/ui/sidebar";
import { BreadCrumb, BreadCrumbProps } from "./BreadCrumb";

export interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType;
}

interface SidebarProps {
  sideBarItems: SidebarItem[];
}

/**
 * SideBar component that renders a sidebar with breadcrumb navigation and menu items.
 *
 * @param {SidebarProps & BreadCrumbProps & { label?: string, baseUrl?: string }} props - The props for the SideBar component.
 * @param {Array} props.sideBarItems - An array of sidebar items to be displayed.
 * @param {Array} props.breadCrumbItems - An array of breadcrumb items to be displayed.
 * @param {string} [props.label="Sidebar"] - The label for the sidebar.
 * @param {string} [props.baseUrl=""] - The base URL to be prefixed to each sidebar item URL.
 *
 * @returns {JSX.Element} The rendered SideBar component.
 *
 * @example
 * ```tsx
 * const sideBarItems = [
 *   { title: 'Home', url: '/home', icon: HomeIcon },
 *   { title: 'Profile', url: '/profile', icon: ProfileIcon },
 * ];
 *
 * const breadCrumbItems: breadCrumbItem[] = [
 *        { href: `/`, label: "Home" },
 *        { href: `/user/${userId}`, label: "User" },
 *        { href: `/user/${userId}/services`, label: sessionId === userId ? "My Services" : "Services" },
 *        { href: `/user/${userId}/profile`, label: sessionId === userId ? "My Profile" : "Profile"  },
 * ];
 *
 * <SideBar
 *   sideBarItems={sideBarItems}
 *   breadCrumbItems={breadCrumbItems}
 *   label="Main Sidebar"
 *   baseUrl="/app"
 * />
 * ```
 */
export function SideBar({
  sideBarItems = [],
  breadCrumbItems = [],
  baseUrl = "",
}: SidebarProps & BreadCrumbProps & { baseUrl?: string }) {
  // Get the current pathname
  const pathname = usePathname();
  return (
    <Sidebar
      collapsible="none"
      className={`h-full min-h-screen border-r-[2px] border-gray-200`}
    >
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <div className="mb-4">
            <BreadCrumb breadCrumbItems={breadCrumbItems} />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {sideBarItems.map((item) => {
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
