"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { SidebarProvider } from "~/components/ui/sidebar";
import type { SidebarItem } from "~/components/sidebar/SideBar";
import { SideBar } from "~/components/sidebar/SideBar";
import { Package, Settings, Bell, PlusSquare, Receipt } from "lucide-react";
import type { BreadCrumbItem } from "~/components/sidebar/BreadCrumb";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get userId from URL parameters
  const { userId } = useParams();
  const sessionId = useSession().data?.user?.id;

  // Define sidebar menu items based on session user ID
  const sideBarItems: SidebarItem[] =
    sessionId === userId
      ? [
          { title: "Profile Settings", url: `/profile`, icon: Settings },
          { title: "Notifications", url: `/notifications`, icon: Bell },
          { title: "My Services", url: `/services`, icon: Package },
          {
            title: "My Subscriptions",
            url: `/subscriptions`,
            icon: PlusSquare,
          },
          {
            title: "Personal Billing",
            url: `/billing`,
            icon: Receipt,
          },
        ]
      : [
          { title: "View Profile", url: `/profile`, icon: Settings },
          { title: "User Services", url: `/services`, icon: Package },
        ];

  // Example breadcrumb items (adjust as needed)
  const breadCrumbItems: BreadCrumbItem[] = [
    { href: `/`, label: "Home" },
    { href: `/user/${String(userId)}`, label: "User" },
    {
      href: `/user/${String(userId)}/services`,
      label: sessionId === userId ? "My Services" : "Services",
    },
    {
      href: `/user/${String(userId)}/profile`,
      label: "Profile",
    },
    {
      href: `/user/${String(userId)}/subscriptions`,
      label: "Subscriptions",
    },
    {
      href: `/user/${String(userId)}/billing`,
      label: "Billing",
    },
  ];

  return (
    <SidebarProvider>
      {/* This flex container ensures sidebar and main content are side by side */}
      <div className="flex min-h-screen w-full">
        {/* Sidebar (fixed width) */}
        <SideBar
          sideBarItems={sideBarItems}
          baseUrl={`/user/${String(userId)}`}
          breadCrumbItems={breadCrumbItems}
        />

        {/* Main content expands to fill remaining space */}
        <main className="flex-1 overflow-hidden bg-gray-100 p-0">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
