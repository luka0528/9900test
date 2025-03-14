"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';


interface UserPageProps {
  params: {
    userId: string;
  };
}

export default function UserPage({ params }: UserPageProps) {
  const router = useRouter();
  const { userId } = params;

  useEffect(() => {
    // Redirect to the settings page
    router.replace(`/user/${userId}/profile`);
  }, [userId, router]);

  // Return a loading state while redirecting
  return <div>Redirecting to user profile...</div>;
}