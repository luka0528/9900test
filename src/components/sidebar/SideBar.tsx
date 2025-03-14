"use client";

import React, { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
    HomeIcon,
    ListOrderedIcon,
    ShoppingBagIcon,
    BookmarkIcon,
    SettingsIcon,
    LucideIcon,
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

export function SideBar({ className, items = defaultSidebarItems }: SidebarProps) {
    const currentPath = window.location.pathname;

    // Function to construct the complete URL by appending item href to current path
    const getFullUrl = (itemHref: string) => {
        if (itemHref === "/") return currentPath; // If href is root, just use current path
        return `${currentPath.replace(/\/$/, '')}${itemHref}`; // Remove trailing slash if exists
    };

    return (
        <aside
            className={cn(
                "flex h-screen w-64 flex-col border-r bg-background px-3 py-4",
                className
            )}
        >
            <div className="space-y-1">
                {items.map((item) => {
                    const fullUrl = getFullUrl(item.href);
                    return (
                        <Button
                            key={item.name}
                            variant={currentPath === item.href ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                                "w-full justify-start gap-3 text-sm font-medium",
                                currentPath === item.href
                                    ? "bg-muted"
                                    : "hover:bg-muted hover:text-foreground"
                            )}
                            asChild
                        >
                            <div 
                                onClick={() => window.location.href = item.href} 
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