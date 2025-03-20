"use client";

import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { Upload, UserPen } from "lucide-react";

import { AllServiceSidebar } from "../../../components/service/AllServiceSidebar";

export default function SubscriptionsPage() {
  const { data: session } = useSession();

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AllServiceSidebar />
      <div className="flex h-full grow flex-col">
        <div className="flex min-h-[5rem] items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Your Subscriptions</h1>
        </div>

        <Separator className="my-4" />

        <div>CONTENT HERE</div>
      </div>
    </div>
  );
}
