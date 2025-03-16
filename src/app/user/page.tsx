"use client";

import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const RedirectUserPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Compute the redirect path only when needed
  const redirectPath = useMemo(() => {
    if (status === "authenticated") return `/user/${session?.user?.id}/profile`;
    if (status === "unauthenticated") return "/login";
    return null; // Stay on the current page while loading
  }, [status, session]);

  useEffect(() => {
    if (redirectPath) router.replace(redirectPath);
  }, [redirectPath, router]);

  // Display a loading state while authentication is in progress
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="ml-3 flex items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-500"></div>
          <span className="ml-3 text-lg text-gray-500">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  return null; // No content needed, only handles redirection
};

export default RedirectUserPage;
