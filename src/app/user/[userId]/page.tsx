"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "~/components/ui/skeleton"; // Optional: For better UX

export default function UserPage() {
  const router = useRouter();
  const { userId } = useParams();

  // Compute redirect path once to avoid unnecessary re-renders
  const redirectPath = useMemo(
    () => (userId ? `/user/${userId}/profile` : null),
    [userId],
  );

  useEffect(() => {
    if (redirectPath) router.replace(redirectPath);
  }, [redirectPath, router]);

  // Display a loading state while redirecting
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-500"></div>
      <span className="ml-3 text-lg text-gray-500">
        Redirecting to user profile...
      </span>
    </div>
  );
}
