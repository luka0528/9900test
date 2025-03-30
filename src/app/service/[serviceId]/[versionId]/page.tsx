"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Separator } from "~/components/ui/separator";
import {
  ChevronDown,
  Heart,
  HeartOff,
  Loader2,
  MessageSquare,
  AlertTriangle,
  HandPlatter,
  FileText,
} from "lucide-react";
import { api } from "~/trpc/react";
import { ServiceSidebar } from "~/components/service/ServiceSidebar";
import { toast } from "sonner";

export default function ServicePage() {
  const { data: session } = useSession();
  const params = useParams();
  const serviceId = params.serviceId as string;
  const versionId = params.versionId as string;
  const router = useRouter();

  const [isSaved, setIsSaved] = useState(false);

  // Fetch service data from backend
  const {
    data: service,
    isLoading: serviceLoading,
    error: serviceError,
  } = api.service.getServiceMetadataById.useQuery({ serviceId });

  // Fetch version data from backend
  const {
    data: versionData,
    isLoading: versionLoading,
    error: versionError,
  } = api.version.getDocumentationByVersionId.useQuery({
    versionId,
  });

  // Handle saving/favoriting service
  const toggleSaveService = () => {
    if (!session) {
      toast.error("Please log in to save services");
      return;
    }

    // Here you would call an API to save/unsave
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Removed from favorites" : "Added to favorites");
  };

  // Show loading state
  if (serviceLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (serviceError || !service) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-2xl font-bold text-destructive">
            Service not found
          </h2>
          <p className="mt-2 text-muted-foreground">
            The service you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to view it.
          </p>
          <Button className="mt-4" onClick={() => router.push("/service")}>
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <ServiceSidebar serviceId={serviceId} versionId={versionId} />
      <div className="flex h-full grow flex-col overflow-y-auto">
        <div className="p-6">
          {/* Service Header with Name and Actions */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">{service.name}</h1>
            <div className="flex items-center gap-2">
              <Button variant="secondary">
                <MessageSquare className="mr-2 h-4 w-4" />
                Support
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={toggleSaveService}
              >
                {isSaved ? <HeartOff /> : <Heart />}
              </Button>

              {/* Only show edit button for service creator */}
              {session &&
                service.owners.some(
                  (owner) => owner.user.id === session.user.id,
                ) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Edit
                        <ChevronDown className="text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/service/${serviceId}/edit`)
                        }
                      >
                        <HandPlatter className="h-4 w-4" />
                        Edit service content
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/service/${serviceId}/${versionId}/edit`)
                        }
                      >
                        <FileText className="h-4 w-4" />
                        Edit version {versionData?.version} details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

              {/* Version selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    {versionData?.version ?? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <ChevronDown className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {service.versions.map((version) => (
                    <DropdownMenuItem
                      key={version.version}
                      onClick={() =>
                        router.push(`/service/${serviceId}/${version.id}`)
                      }
                    >
                      {version.version}
                      {version.version === versionData?.version && " (current)"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6 flex flex-wrap gap-2">
            {service.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>

          {/* Last updated info */}
          <div className="mb-4 text-sm text-muted-foreground">
            Last updated:{" "}
            {versionData?.createdAt
              ? new Date(versionData.createdAt).toLocaleDateString()
              : "N/A"}
          </div>

          {/* Service description */}
          <div className="mb-8">
            {versionData ? (
              versionLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading version information...</span>
                </div>
              ) : versionData ? (
                <p>{versionData.description}</p>
              ) : (
                <p className="text-muted-foreground">
                  No version description available
                </p>
              )
            ) : (
              <p className="text-muted-foreground">
                Select a version to see details
              </p>
            )}
          </div>

          <Separator className="my-8" />

          {/* Version Content */}
          {versionLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : versionError ? (
            <div className="rounded-md bg-destructive/10 p-4 text-center">
              <p className="font-medium text-destructive">
                Error loading version content: {versionError.message}
              </p>
            </div>
          ) : versionData?.contents ? (
            <div className="space-y-10">
              {versionData.contents.map((content, index) => (
                <div key={index} className="mb-10">
                  <h2 className="mb-4 text-xl font-semibold">
                    {content.title}
                  </h2>

                  {/* Content description */}
                  <p className="mb-6">{content.description}</p>

                  {/* If content has table rows, display them */}
                  {content.rows && content.rows.length > 0 && (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/3">Method/Code</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {content.rows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="font-mono">
                                {row.routeName}
                              </TableCell>
                              <TableCell>{row.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">
                No content available for this version
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
