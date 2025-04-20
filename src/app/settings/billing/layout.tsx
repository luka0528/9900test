"use client";

import {
  EyeIcon,
  Package,
  ReceiptText,
  PlusSquare,
  LockKeyhole,
} from "lucide-react";
import {
  DefaultSideBar,
  type SidebarItem,
} from "~/components/sidebar/DefaultSideBar";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const items: SidebarItem[] = [
    { title: "Profile", url: `/settings/profile`, icon: EyeIcon },
    { title: "Credentials", url: `/settings/credentials`, icon: LockKeyhole },
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
      <main className="h-full flex-1 overflow-y-auto p-0">{children}</main>
    </div>
  );
}
