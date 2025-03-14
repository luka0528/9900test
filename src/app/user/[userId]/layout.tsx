'use client';
import { Settings, Package } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import SideBar from "~/components/sidebar/SideBar"; 

// Define the SidebarItem interface if not already imported
interface SidebarItem {
    name: string;
    href: string;
    icon: React.ReactNode;
}

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Get userId from URL parameters
    const { userId } = useParams();
    const sessionId = useSession().data?.user.id;

    // Define sidebar menu items based on session user ID
    const sidebarItems: SidebarItem[] = sessionId === userId ? [
        { name: "Profile Settings", href: "/profile", icon: <Settings /> },
        { name: "My Services", href: "/services", icon: <Package /> }
    ] : [
        { name: "View Profile", href: `/user/${userId}/profile`, icon: <Settings /> },
        { name: "User Services", href: `/user/${userId}/services`, icon: <Package /> }
    ];

    return (
        <div className="flex flex-1 min-h-0">
            <SideBar items={sidebarItems} baseUrl={`/user/${userId}`} />
            <div className="flex-1">{children}</div>
        </div>
    );
}
