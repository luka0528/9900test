"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="flex h-20 w-full items-center justify-between border-b-2 border-border bg-background px-8">
      <div className="flex items-center justify-start">
        <h1 className="text-2xl font-bold">LOGO</h1>
        {/* Nav content goes here */}
      </div>
      <div className="flex items-center justify-end gap-5">
        {session ? (
          <>
            <p className="text-lg font-medium">{session?.user?.name}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="transition-transform duration-300 hover:scale-110 hover:cursor-pointer">
                  <AvatarImage src={session?.user?.image ?? undefined} />
                  <AvatarFallback>
                    {session?.user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={40} className="w-72">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/user/${String(session?.user?.id)}/profile`)
                  }
                >
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button variant="ghost" onClick={() => signIn()}>
            Login
          </Button>
        )}
      </div>
    </div>
  );
}
