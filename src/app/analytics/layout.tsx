import { HydrateClient } from "~/trpc/server";
import NavBar from "~/components/navbar/NavBar";
import { SessionProvider } from "next-auth/react";

export default function AnalyticsLayout({
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
        <div className="flex min-h-0 flex-1 justify-center">{children}</div>
      </div>
    </SessionProvider>
  );
}
