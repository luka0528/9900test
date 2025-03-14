"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
    HomeIcon,
    ListOrderedIcon,
    ShoppingBagIcon,
    BookmarkIcon,
    SettingsIcon,
} from "lucide-react";

type SidebarProps = {
    className?: string;
    items?: SidebarItem[]; // Allow custom items to be passed in
};

// Update the SidebarItem type to accept LucideIcon component
export type SidebarItem = {
    name: string;
    href: string;
    icon: ReactNode; // Changed from LucideIcon to ElementType
    children?: ReactNode;
};

// Default sidebar items using the new pattern
const defaultSidebarItems: SidebarItem[] = [
    {
        name: "Home",
        href: "/",
        icon: <HomeIcon />,
    },
    {
        name: "Listings",
        href: "/listings",
        icon: <ListOrderedIcon />,
    },
    {
        name: "Orders",
        href: "/orders",
        icon: <ShoppingBagIcon />,
    },
    {
        name: "Saved",
        href: "/saved",
        icon: <BookmarkIcon />,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: <SettingsIcon />,
    },
];



// Styling constants for the sidebar
const sidebarStyles = {
    background: "bg-slate-100", // Light slate gray background
    hover: "hover:bg-slate-200", // Slightly darker shade for hover states
    active: "bg-slate-200", // Active state matches hover for consistency
};

/**
 * SideBar component renders a sidebar with a list of items.
 * Each item can be clicked to navigate to a different route.
 *
 * @param {object} props - The properties object.
 * @param {string} [props.className] - Additional class names to apply to the sidebar.
 * @param {Array} [props.items=defaultSidebarItems] - The list of items to display in the sidebar.
 * @param {string} [props.baseUrl=""] - The base URL to prepend to each item's href.
 *
 * @returns {JSX.Element} The rendered sidebar component.
 *
 * @example
 * // Example usage:
 * import { SideBar } from './SideBar';
 * 
 * const items = [
 *   { name: 'Home', href: '/home', icon: <HomeIcon /> },
 *   { name: 'Profile', href: '/profile', icon: <ProfileIcon /> },
 *   // Add more items as needed
 * ];
 * 
 * function App() {
 *   return (
 *     <SideBar className="custom-class" items={items} baseUrl="/app" />
 *   );
 * }
 */
export function SideBar({ className, items = defaultSidebarItems, baseUrl = "" }: SidebarProps & { baseUrl?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    return (
        <aside
            className={cn(
                "flex h-screen w-64 flex-col border-r px-3 py-4",
                sidebarStyles.background,
                className
            )}
        >
            <div className="space-y-1">
                {items.map((item) => {
                    const isActive = pathname === `${baseUrl}${item.href}`;
                    return (
                        <Button
                            key={item.name}
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full justify-start gap-3 text-sm font-medium",
                                isActive
                                    ? sidebarStyles.active
                                    : sidebarStyles.hover
                            )}
                            asChild
                        >
                            <div
                                onClick={() => router.push(`${baseUrl}${item.href}`)}
                                className="flex items-center w-full cursor-pointer"
                            >
                                <span className="mr-3">{item.icon}</span>
                                <span>{item.children || item.name}</span>
                            </div>
                        </Button>
                    );
                })}
            </div>
        </aside>
    );
}

export default SideBar;