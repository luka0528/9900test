import { HydrateClient } from "~/trpc/server";
import NavBar from "~/components/navbar/NavBar";
import { SessionProvider } from "next-auth/react";
import React from "react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <SessionProvider>
      <div className="flex h-screen w-screen flex-col">
        <HydrateClient>
          <NavBar />
        </HydrateClient>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </SessionProvider>
  );
}
