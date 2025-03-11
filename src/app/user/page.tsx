"use client";

// TODO: If the user gets here and is logged in, redirect them to /user/[userId]
// TODO: If the user gets here and is not logged in, redirect them to /login

// need to chck if the user is logged in or not, and redirect them to user/[userId] if they are logged in
// if they are not logged in, redirect them to /login
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const RedirectUserPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push(`/user/${session?.user?.id}`);
    } else if (status === "loading") {
      // waiting for authentication status
    } else {
      router.push("/login");
    }
  }, [status, session, router]);

  // This component does not render anything because it only handles redirection
  return null;
};

export default RedirectUserPage;
