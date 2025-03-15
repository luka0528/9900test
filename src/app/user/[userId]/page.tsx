"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';


export default function UserPage() {
  const router = useRouter();
  const { userId } = useParams();

  useEffect(() => {
    // Redirect to the settings page
    router.replace(`/user/${userId}/profile`);
  }, [userId, router]);

  // Return a loading state while redirecting
  return <div>Redirecting to user profile...</div>;
}