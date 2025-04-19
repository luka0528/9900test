"use client";

import { useParams, useRouter } from "next/navigation";
import { ServiceSidebar } from "~/components/service/ServiceSidebar";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { methodColors } from "~/lib/rest-method";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  SchemaViewer,
  type SchemaViewerProps,
} from "~/components/auto-generation/SchemaViewer";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { RestMethod } from "@prisma/client";
import { toast } from "sonner";
export default function EndpointPage() {
  const { data: session } = useSession();
  const params = useParams();
  const utils = api.useUtils();
  const endpointId = params.endpointId as string;

  const { data: endpoint } = api.endpoint.getEndpoint.useQuery({
    endpointId,
  });

  const { data: service } = api.service.getServiceById.useQuery(
    params.serviceId as string,
  );

  const addOperation = api.endpoint.addOperation.useMutation({
    onSuccess: () => {
      void utils.endpoint.getEndpoint.invalidate({
        endpointId,
      });
      void utils.service.getServiceById.invalidate(params.serviceId as string);
      toast.success("Operation added successfully");
    },
  });

  const deleteOperation = api.endpoint.deleteOperation.useMutation({
    onSuccess: () => {
      void utils.endpoint.getEndpoint.invalidate({
        endpointId,
      });
      void utils.service.getServiceById.invalidate(params.serviceId as string);
      toast.success("Operation deleted successfully");
    },
  });

  const handleAddOperation = () => {
    // Try to get the method that is not already in the endpoint
    const method = Object.values(RestMethod).find(
      (method) => !endpoint?.operations.some((op) => op.method === method),
    );

    if (!method) {
      toast.error("No new REST methods available");
      return;
    }

    addOperation.mutate({
      endpointId,
      method,
      description: "",
      deprecated: false,
    });
  };

  const isOwner = service?.owners.some(
    (owner) => owner.user.id === session?.user?.id,
  );

  if (!endpoint) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <ServiceSidebar serviceId={params.serviceId as string} />
      <div className="flex h-full grow flex-col overflow-y-auto">
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{endpoint.path}</h1>
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleAddOperation();
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Operation
                </Button>
              </div>
            )}
          </div>

          <Accordion type="multiple" className="space-y-4">
            {endpoint.operations.map((operation) => (
              <AccordionItem key={operation.id} value={operation.id}>
                <AccordionTrigger className="flex gap-3 py-4">
                  <div className="flex items-center gap-3">
                    <Badge className={methodColors[operation.method]}>
                      {operation.method}
                    </Badge>
                    <span className="text-xl font-semibold">
                      {endpoint.path}
                    </span>
                    {operation.deprecated && (
                      <Badge variant="destructive">Deprecated</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 px-4 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">
                        {operation.description}
                      </p>
                      {isOwner && (
                        <div className="flex gap-2">
                          <Link
                            href={`/service/${params.serviceId as string}/${params.versionId as string}/${endpointId}/${operation.id}/edit`}
                          >
                            <Button variant="outline" size="sm">
                              <Pencil className="mr-1 h-4 w-4" />
                              Edit
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Operation
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this
                                  operation? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    deleteOperation.mutate({
                                      operationId: operation.id,
                                    });
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>

                    <Tabs defaultValue="parameters">
                      <TabsList className="justify-start">
                        {operation.parameters.length > 0 && (
                          <TabsTrigger value="parameters">
                            Parameters
                          </TabsTrigger>
                        )}
                        {operation.requestBody && (
                          <TabsTrigger value="requestBody">
                            Request Body
                          </TabsTrigger>
                        )}
                        {operation.responses.length > 0 && (
                          <TabsTrigger value="responses">Responses</TabsTrigger>
                        )}
                      </TabsList>

                      {operation.parameters.length > 0 && (
                        <TabsContent value="parameters" className="mt-4">
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Schema</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {operation.parameters.map((param) => (
                                  <TableRow key={param.id}>
                                    <TableCell className="gap-2 font-medium">
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                          {param.deprecated && (
                                            <Badge variant="destructive">
                                              Deprecated
                                            </Badge>
                                          )}
                                          {param.required ? (
                                            <Badge>Required</Badge>
                                          ) : (
                                            <Badge variant="secondary">
                                              Optional
                                            </Badge>
                                          )}
                                        </div>
                                        <p>{param.name}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col gap-2">
                                        <Badge
                                          variant="secondary"
                                          className="w-fit"
                                        >
                                          {param.parameterLocation}
                                        </Badge>
                                        <p>{param.description}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="w-1/2">
                                      <SchemaViewer
                                        schema={
                                          JSON.parse(
                                            param.schemaJson,
                                          ) as SchemaViewerProps["schema"]
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      )}

                      {operation.requestBody && (
                        <TabsContent value="requestBody" className="mt-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">Description</h4>
                              <p className="text-muted-foreground">
                                {operation.requestBody.description}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Schema</h4>
                              <pre className="mt-2 rounded-lg bg-muted p-4">
                                {JSON.stringify(
                                  JSON.parse(operation.requestBody.contentJson),
                                  null,
                                  2,
                                )}
                              </pre>
                            </div>
                          </div>
                        </TabsContent>
                      )}

                      {operation.responses.length > 0 && (
                        <TabsContent value="responses" className="mt-4">
                          <div className="space-y-6">
                            {operation.responses.map((response) => (
                              <div key={response.id} className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={
                                      response.statusCode < 400
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    }
                                  >
                                    {response.statusCode}
                                  </Badge>
                                  <h4 className="font-medium">
                                    {response.description}
                                  </h4>
                                </div>
                                <div>
                                  <h5 className="text-sm font-medium">
                                    Content
                                  </h5>
                                  <pre className="mt-2 rounded-lg bg-muted p-4">
                                    {JSON.stringify(
                                      JSON.parse(response.contentJson),
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </div>
                                {response.headersJson && (
                                  <div>
                                    <h5 className="text-sm font-medium">
                                      Headers
                                    </h5>
                                    <pre className="mt-2 rounded-lg bg-muted p-4">
                                      {JSON.stringify(
                                        JSON.parse(response.headersJson),
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
