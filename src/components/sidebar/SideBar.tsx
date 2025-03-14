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