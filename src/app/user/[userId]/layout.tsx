"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { SidebarProvider } from "~/components/ui/sidebar";
import type { SidebarItem } from "~/components/sidebar/DefaultSideBar";
import { DefaultSideBar } from "~/components/sidebar/DefaultSideBar";
import { Package, Settings, Bell, PlusSquare } from "lucide-react";
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
        ]
      : [
          { title: "View Profile", url: `/profile`, icon: Settings },
          { title: "User Services", url: `/services`, icon: Package },
        ];

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <DefaultSideBar items={sideBarItems} />
      <main className="flex-1 h-full overflow-hidden p-0">{children}</main>
    </div>
  );
}
