import { HydrateClient } from "~/trpc/server";
import NavBar from "~/components/navbar/NavBar";
import SideBar, { SidebarItem } from "~/components/sidebar/SideBar";
import { SessionProvider } from "next-auth/react";
import { Settings, Package } from "lucide-react";
import React from "react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Define sidebar menu items
  const sidebarItems: SidebarItem[] = [
    { name: "Settings", href: "/settings", icon: <Settings /> },
    { name: "Services", href: "/services", icon: <Package /> }
  ];

  return (
    <SessionProvider>
      <div className="flex h-screen w-screen flex-col">
        <HydrateClient>
          <NavBar />
        </HydrateClient>
        <div className="flex flex-1 min-h-0">
          <SideBar items={sidebarItems} />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </SessionProvider>
  );
}
