import { EyeIcon, Package } from "lucide-react";
import {
  DefaultSideBar,
  type SidebarItem,
} from "~/components/sidebar/DefaultSideBar";

export const ProfileSidebar = ({ userId }: { userId: string }) => {
  const items: SidebarItem[] = [
    { title: "View Profile", url: `/user/${userId}/profile`, icon: EyeIcon },
    { title: "User Services", url: `/user/${userId}/services`, icon: Package },
  ];
  return <DefaultSideBar items={items} />;
};
