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
      <div className="flex w-screen h-screen flex-col overflow-hidden">
        <HydrateClient>
          <NavBar />
        </HydrateClient>
        <div className="flex min-h-0 flex-1 justify-center">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
