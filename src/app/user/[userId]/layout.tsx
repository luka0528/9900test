'use client';
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { SideBar, SidebarItem } from "~/components/sidebar/SideBar"
import { Package, Settings } from "lucide-react"

export default function ProfileLayout({children,}: {children: React.ReactNode;}) {
    // Get userId from URL parameters
    const { userId } = useParams();
    const sessionId = useSession().data?.user.id;

    // Define sidebar menu items based on session user ID
    const items: SidebarItem[] = sessionId === userId ? [
        { title: "Profile Settings", url: `/profile`, icon: Settings },
        { title: "My Services", url: `/services`, icon: Package }
    ] : [
        { title: "View Profile", url: `/profile`, icon: Settings },
        { title: "User Services", url: `/services`, icon: Package }
    ];

    return (
        <SidebarProvider>
          <SideBar items={items} label="Profile" baseUrl={`/user/${userId}`}/>
          <main>
            {children}
          </main>
        </SidebarProvider>
      )
}
