"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { Upload, UserPen, Loader2, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { AllServiceSidebar } from "~/components/service/AllServiceSidebar";
import { ServiceCard } from "~/components/service/ServiceCard";
import { Input } from "~/components/ui/input";
import Link from "next/link";

export default function ServicesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Data from BE
  console.log(api.service.getAllByUserId.useQuery());
  const {
    data: services,
    isLoading,
    error,
  } = api.service.getAllByUserId.useQuery();

  // Handle direct navigation to add service page
  const handleAddServiceClick = () => {
    router.push("/service/add-service");
  };

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
              <DropdownMenuItem key="manual" onClick={handleAddServiceClick}>
                <UserPen className="mr-2 h-4 w-4" />
                Manual Input
              </DropdownMenuItem>
              <DropdownMenuItem key="automatic">
                <Upload className="mr-2 h-4 w-4" />
              <Link href="/service/add" className="w-full">
                <DropdownMenuItem key={"manual"}>
                  <UserPen />
                  Manual Input
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem key={"automatic"}>
                <Upload />
                Automatic Extraction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-4 pb-4">
          <Input
            placeholder="Search services by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <Separator className="mb-6" />

        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex h-32 w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-destructive">
              Error loading services. Please try again.
            </div>
          ) : !session ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="mb-2 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                Sign in to view your services
              </h3>
              <p className="text-muted-foreground">
                You need to be logged in to view and manage your services.
              </p>
            </div>
          ) : services?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="mb-2 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No services found</h3>
              <p className="text-muted-foreground">
                You haven't created any services yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services?.map((service, index) => (
                <ServiceCard
                  key={index}
                  service={{
                    id: service.id,
                    name: service.name,
                    owner: service.owner ? service.owner : "No Name",
                    tags: service.tags,
                    latestVersion: service.latestVersion,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
