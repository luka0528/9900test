"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ServiceCard } from "~/components/service/ServiceCard";
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
  Ban,
  CheckCircle,
  Loader2,
  MessageSquare,
  AlertTriangle,
  HandPlatter,
  FileText,
  ChevronLeft,
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
  const utils = api.useUtils();
  const searchParams = useSearchParams();
  const isFromMarketplace = searchParams.get("fromMarketplace") === "true";

  const handleBackToSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("fromMarketplace");
    const queryString = params.toString();

    router.push(`/marketplace${queryString ? `?${queryString}` : ""}`);
  };

  const {
    data: service,
    isLoading: serviceLoading,
    error: serviceError,
  } = api.service.getServiceMetadataById.useQuery({ serviceId });

  const { data: relatedServicesData, isLoading: relatedServicesLoading } =
    api.service.getRelatedServices.useQuery(
      {
        currentServiceId: serviceId,
        tags: service?.tags.map((tag) => tag.name) ?? [],
        limit: 6,
      },
      {
        enabled: !!service,
      },
    );

  const {
    data: versionData,
    isLoading: versionLoading,
    error: versionError,
  } = api.version.getDocumentationByVersionId.useQuery({
    versionId,
  });

  const { mutate: updateDeprecated, isPending: isUpdatingDeprecated } =
    api.version.updateDeprecated.useMutation({
      onSuccess: () => {
        toast.success("Version updated");
        void utils.version.getDocumentationByVersionId.invalidate({
          versionId,
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  if (serviceLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (serviceError ?? !service) {
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
      <ServiceSidebar serviceId={serviceId} />
      <div className="flex h-full grow flex-col overflow-y-auto">
        <div className="p-6">
          {/* Show button if we came from marketplace */}
          {isFromMarketplace && (
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={handleBackToSearch}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Marketplace
              </Button>
            </div>
          )}

          {/* Service Header with Name and Actions */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">{service.name}</h1>
              {versionData?.isDeprecated && (
                <Badge variant="destructive">Deprecated</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary">
                <MessageSquare className="mr-2 h-4 w-4" />
                Support
              </Button>
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
                      <DropdownMenuItem
                        onClick={() =>
                          updateDeprecated({
                            versionId,
                            isDeprecated: !versionData?.isDeprecated,
                          })
                        }
                        disabled={isUpdatingDeprecated}
                      >
                        {isUpdatingDeprecated ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : versionData?.isDeprecated ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Unmark as deprecated
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4" />
                            Mark as deprecated
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

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

          <div className="mb-6 flex flex-wrap gap-2">
            {service.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>

          <div className="mb-4 text-sm text-muted-foreground">
            Last updated:{" "}
            {versionData?.createdAt
              ? new Date(versionData.createdAt).toLocaleDateString()
              : "N/A"}
          </div>

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
                  <p className="mb-6">{content.description}</p>
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

        <div className="p-6">
          <Separator className="mb-8" />
          <h2 className="mb-6 text-2xl font-bold">Related Services</h2>

          {relatedServicesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : relatedServicesData?.foundRelated ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relatedServicesData.relatedServices.map((relatedService) => (
                <ServiceCard
                  key={relatedService.id}
                  service={{
                    id: relatedService.id,
                    name: relatedService.name,
                    owner: relatedService.owners[0]?.user.name ?? "",
                    tags: relatedService.tags.map((tag) => tag.name),
                    latestVersionId: relatedService.versions[0]?.id ?? "",
                    latestVersion: relatedService.versions[0]?.version ?? "",
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>
                {relatedServicesData?.message ?? "No related services found"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
