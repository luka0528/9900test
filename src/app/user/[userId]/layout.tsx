"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { SidebarProvider } from "~/components/ui/sidebar";
import { SideBar, SidebarItem } from "~/components/sidebar/SideBar";
import { Package, Settings, Bell, PlusSquare } from "lucide-react";
import { breadCrumbItem } from "~/components/breadcrumb/BreadCrumb";

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
          { title: "My Subscriptions", url: `/subscriptions`, icon: PlusSquare },
        ]
      : [
          { title: "View Profile", url: `/profile`, icon: Settings },
          { title: "User Services", url: `/services`, icon: Package },
        ];

  // Example breadcrumb items (adjust as needed)
  const breadCrumbItems: breadCrumbItem[] = [
    { href: `/`, label: "Home" },
    { href: `/user/${userId}`, label: "User" },
    {
      href: `/user/${userId}/services`,
      label: sessionId === userId ? "My Services" : "Services",
    },
    {
      href: `/user/${userId}/profile`,
      label: sessionId === userId ? "My Profile" : "Profile",
    },
  ];

  return (
    <SidebarProvider>
      {/* This flex container ensures sidebar and main content are side by side */}
      <div className="flex min-h-screen w-full">
        {/* Sidebar (fixed width) */}
        <SideBar
          sideBarItems={sideBarItems}
          baseUrl={`/user/${userId}`}
          breadCrumbItems={breadCrumbItems}
        />

        {/* Main content expands to fill remaining space */}
        <main className="flex-1 overflow-auto p-0 bg-gray-100">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
