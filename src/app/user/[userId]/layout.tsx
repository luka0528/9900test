"use client";

import { ProfileSidebar } from "~/components/user/ProfileSidebar";
import { useParams } from "next/navigation";
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = useParams();
  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <ProfileSidebar userId={userId as string} />
      <main className="h-full flex-1 p-0">{children}</main>
    </div>
  );
}
