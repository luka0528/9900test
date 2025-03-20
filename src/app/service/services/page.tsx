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

export default function ServicesPage() {
  const { data: session } = useSession();

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AllServiceSidebar />
      <div className="flex h-full grow flex-col">
        <div className="flex min-h-[5rem] items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Your Services</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">Add Service</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <a href="/service/add-service" className="w-full">
                <DropdownMenuItem key={"manual"}>
                  <UserPen />
                  Manual Input
                </DropdownMenuItem>
              </a>
              <DropdownMenuItem key={"automatic"}>
                <Upload />
                Automatic Extraction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="my-4" />

        <div>CONTENT HERE</div>
      </div>
    </div>
  );
}
