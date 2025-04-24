"use client";

import React from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { ThemeToggle } from "~/components/theme/theme-toggle";
import { NotificationDropdown } from "~/components/NotificationDropdown";

const serviceNavigationItems = [
  {
    title: "My Services",
    href: "/service/owned",
    description: "View your owned services",
  },
  {
    title: "My Subscriptions",
    href: "/service/subscriptions",
    description: "View your subscriptions",
  },
  {
    title: "Add Service",
    href: "/service/add",
    description: "Add a new service",
  },
];

export default function NavBar() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center justify-start gap-4">
          <h1 className="text-2xl font-bold">LOGO</h1>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  onPointerMove={(e) => e.preventDefault()}
                >
                  Services
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {serviceNavigationItems.map((item) => (
                      <ListItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                      >
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/marketplace" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Marketplace
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/analytics" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Analytics
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <NotificationDropdown />
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
                <DropdownMenuContent
                  align="end"
                  sideOffset={40}
                  className="w-72"
                >
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push(`/settings/profile`)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      await signOut({ redirect: false });
                      router.push(`/marketplace`);
                    }}
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
    </nav>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
