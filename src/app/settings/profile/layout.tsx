"use client";

import { EyeIcon, Package, ReceiptText } from "lucide-react";
import {
  DefaultSideBar,
  type SidebarItem,
} from "~/components/sidebar/DefaultSideBar";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const items: SidebarItem[] = [
    { title: "Profile", url: `/settings/profile`, icon: EyeIcon },
    { title: "Billing", url: `/settings/profile`, icon: ReceiptText },
    { title: "Services", url: `/settings/profile`, icon: Package },
  ];

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <DefaultSideBar items={items} />
      <main className="h-full flex-1 overflow-hidden p-0">{children}</main>
    </div>
  );
}
