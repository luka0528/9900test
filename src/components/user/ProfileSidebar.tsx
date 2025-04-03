import { EyeIcon, Package, Receipt } from "lucide-react";
import {
  DefaultSideBar,
  type SidebarItem,
} from "~/components/sidebar/DefaultSideBar";

export const ProfileSidebar = ({ userId }: { userId: string }) => {
  const items: SidebarItem[] = [
    { title: "View Profile", url: `/user/${userId}/profile`, icon: EyeIcon },
    { title: "User Services", url: `/user/${userId}/services`, icon: Package },
    { title: "Billing", url: `/user/${userId}/billing`, icon: Receipt },
  ];
  return <DefaultSideBar items={items} />;
};
