"use client";

import { useParams } from "next/navigation";
import { ServiceSidebar } from "~/components/service/ServiceSidebar";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { methodColors } from "~/lib/rest-method";

export default function EndpointPage() {
  const params = useParams();
  const endpointId = params.endpointId as string;

  const { data: endpoint } = api.endpoint.getEndpoint.useQuery({
    endpointId,
  });

  if (!endpoint) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <ServiceSidebar serviceId={params.serviceId as string} />
      <div className="flex h-full grow flex-col overflow-y-auto">
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold">{endpoint.path}</h1>
          </div>

          {endpoint.operations.map((operation) => (
            <Card key={operation.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className={methodColors[operation.method]}>
                    {operation.method}
                  </Badge>
                  <CardTitle>{endpoint.path}</CardTitle>
                  {operation.deprecated && (
                    <Badge variant="destructive">Deprecated</Badge>
                  )}
                </div>
                <p className="mt-2 text-muted-foreground">
                  {operation.description}
                </p>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-4">
                  {operation.parameters.length > 0 && (
                    <AccordionItem value="parameters">
                      <AccordionTrigger>Parameters</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Required</TableHead>
                              <TableHead>Schema</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {operation.parameters.map((param) => (
                              <TableRow key={param.id}>
                                <TableCell className="font-medium">
                                  {param.name}
                                  {param.deprecated && (
                                    <Badge
                                      variant="destructive"
                                      className="ml-2"
                                    >
                                      Deprecated
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{param.parameterLocation}</TableCell>
                                <TableCell>{param.description}</TableCell>
                                <TableCell>
                                  {param.required ? (
                                    <Badge>Required</Badge>
                                  ) : (
                                    <Badge variant="secondary">Optional</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <pre className="text-sm">
                                    {JSON.stringify(
                                      JSON.parse(param.schemaJson),
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {operation.requestBody && (
                    <AccordionItem value="requestBody">
                      <AccordionTrigger>Request Body</AccordionTrigger>
                      <AccordionContent>
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
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {operation.responses.length > 0 && (
                    <AccordionItem value="responses">
                      <AccordionTrigger>Responses</AccordionTrigger>
                      <AccordionContent>
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
                                <h5 className="text-sm font-medium">Content</h5>
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
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
