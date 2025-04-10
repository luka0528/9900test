"use client";

import { EyeIcon, Package, ReceiptText, PlusSquare } from "lucide-react";
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
    { title: "Billing", url: `/settings/billing`, icon: ReceiptText },
    { title: "Services", url: `/settings/services`, icon: Package },
    {
      title: "Subscriptions",
      url: `/settings/subscriptions`,
      icon: PlusSquare,
    },
  ];

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <DefaultSideBar items={items} />
      <main className="h-full flex-1 p-0 overflow-y-auto">{children}</main>
    </div>
  );
}
