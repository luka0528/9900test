"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { SidebarProvider } from "~/components/ui/sidebar";
import type { SidebarItem } from "~/components/sidebar/DefaultSideBar";
import { DefaultSideBar } from "~/components/sidebar/DefaultSideBar";
import { Package, EyeIcon } from "lucide-react";
import type { BreadCrumbItem } from "~/components/sidebar/BreadCrumb";

const sideBarItems: SidebarItem[] = [
  { title: "View Profile", url: `/profile`, icon: EyeIcon },
  { title: "User Services", url: `/services`, icon: Package },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <DefaultSideBar items={sideBarItems} />
      <main className="h-full flex-1 overflow-hidden p-0">{children}</main>
    </div>
  );
}
