'use client';
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { SideBar, SidebarItem } from "~/components/sidebar/SideBar"
import { Package, Settings } from "lucide-react"
import { breadCrumbItem } from "~/components/breadcrumb/BreadCrumb";

export default function ProfileLayout({children,}: {children: React.ReactNode;}) {
    // Get userId from URL parameters
    const { userId } = useParams();
    const sessionId = useSession().data?.user.id;

    // Define sidebar menu items based on session user ID
    const sideBarItems: SidebarItem[] = sessionId === userId ? [
        { title: "Profile Settings", url: `/profile`, icon: Settings },
        { title: "My Services", url: `/services`, icon: Package }
    ] : [
        { title: "View Profile", url: `/profile`, icon: Settings },
        { title: "User Services", url: `/services`, icon: Package }
    ];

    const breadCrumbItems: breadCrumbItem[] = [
        { href: `/`, label: "Home" },
        { href: `/user/${userId}`, label: "User" },
        { href: `/user/${userId}/services`, label: sessionId === userId ? "My Services" : "Services" },
        { href: `/user/${userId}/profile`, label: sessionId === userId ? "My Profile" : "Profile"  },
    ];

    return (
        <SidebarProvider>
          <SideBar sideBarItems={sideBarItems} label="Profile" baseUrl={`/user/${userId}`} breadCrumbItems={breadCrumbItems}/>
          <main>
            {children}
          </main>
        </SidebarProvider>
      )
}
