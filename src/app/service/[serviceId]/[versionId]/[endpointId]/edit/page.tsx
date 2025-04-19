"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { GoBackSideBar } from "~/components/sidebar/GoBackSideBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { methodColors } from "~/lib/rest-method";
import { Checkbox } from "~/components/ui/checkbox";
import { RestMethod, ParameterLocation } from "@prisma/client";

const formSchema = z.object({
  path: z.string().min(1, {
    message: "Path must be at least 1 character.",
  }),
  operations: z.array(
    z.object({
      id: z.string(),
      method: z.nativeEnum(RestMethod),
      description: z.string(),
      deprecated: z.boolean(),
      parameters: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          required: z.boolean(),
          parameterLocation: z.nativeEnum(ParameterLocation),
          schemaJson: z.string(),
          deprecated: z.boolean(),
        }),
      ),
      requestBody: z
        .object({
          id: z.string(),
          description: z.string(),
          contentJson: z.string(),
        })
        .nullable(),
      responses: z.array(
        z.object({
          id: z.string(),
          statusCode: z.number(),
          description: z.string(),
          contentJson: z.string(),
          headersJson: z.string().nullable(),
        }),
      ),
    }),
  ),
});

export default function EditEndpointPage() {
  const router = useRouter();
  const params = useParams();
  const endpointId = params.endpointId as string;
  const utils = api.useUtils();

  const { data: endpoint } = api.endpoint.getEndpoint.useQuery({
    endpointId,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      path: "",
      operations: [],
    },
  });

  useEffect(() => {
    if (endpoint) {
      form.reset({
        path: endpoint.path,
        operations: endpoint.operations.map((op) => ({
          id: op.id,
          method: op.method,
          description: op.description,
          deprecated: op.deprecated,
          parameters: op.parameters.map((param) => ({
            id: param.id,
            name: param.name,
            description: param.description,
            required: param.required,
            parameterLocation: param.parameterLocation,
            schemaJson: param.schemaJson,
            deprecated: param.deprecated,
          })),
          requestBody: op.requestBody
            ? {
                id: op.requestBody.id,
                description: op.requestBody.description,
                contentJson: op.requestBody.contentJson,
              }
            : null,
          responses: op.responses.map((res) => ({
            id: res.id,
            statusCode: res.statusCode,
            description: res.description,
            contentJson: res.contentJson,
            headersJson: res.headersJson,
          })),
        })),
      });
    }
  }, [endpoint, form]);

  const { mutate: updateEndpoint, isPending: isUpdating } =
    api.endpoint.updateEndpoint.useMutation({
      onSuccess: () => {
        toast.success("Endpoint updated successfully");
        void utils.endpoint.getEndpoint.invalidate({ endpointId });
        router.push(
          `/service/${params.serviceId as string}/${params.versionId as string}/${endpointId}`,
        );
      },
      onError: () => {
        toast.error("Failed to update endpoint");
      },
    });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateEndpoint({
      endpointId,
      ...values,
    });
  }

  if (!endpoint) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <GoBackSideBar />
      <div className="flex h-full grow flex-col overflow-y-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Edit Endpoint</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Path</FormLabel>
                  <FormControl>
                    <Input placeholder="/api/endpoint" {...field} />
                  </FormControl>
                  <FormDescription>The path for this endpoint</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-4">
              <FormLabel className="text-lg">Operations</FormLabel>
              {form.watch("operations")?.map((operation, opIndex) => (
                <Card key={opIndex} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => {
                      const operations = form.getValues("operations");
                      form.setValue(
                        "operations",
                        operations.filter((_, idx) => idx !== opIndex),
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <FormField
                        control={form.control}
                        name={`operations.${opIndex}.method`}
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormLabel>Method</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={RestMethod.GET}>
                                  <Badge className={methodColors.GET}>
                                    GET
                                  </Badge>
                                </SelectItem>
                                <SelectItem value={RestMethod.POST}>
                                  <Badge className={methodColors.POST}>
                                    POST
                                  </Badge>
                                </SelectItem>
                                <SelectItem value={RestMethod.PUT}>
                                  <Badge className={methodColors.PUT}>
                                    PUT
                                  </Badge>
                                </SelectItem>
                                <SelectItem value={RestMethod.DELETE}>
                                  <Badge className={methodColors.DELETE}>
                                    DELETE
                                  </Badge>
                                </SelectItem>
                                <SelectItem value={RestMethod.PATCH}>
                                  <Badge className={methodColors.PATCH}>
                                    PATCH
                                  </Badge>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`operations.${opIndex}.deprecated`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Deprecated
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`operations.${opIndex}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Operation description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Parameters</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const operations = form.getValues("operations");
                            const currentParams =
                              operations[opIndex]?.parameters ?? [];
                            form.setValue(`operations.${opIndex}.parameters`, [
                              ...currentParams,
                              {
                                id: crypto.randomUUID(),
                                name: "",
                                description: "",
                                required: false,
                                parameterLocation: ParameterLocation.QUERY,
                                schemaJson: "{}",
                                deprecated: false,
                              },
                            ]);
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add Parameter
                        </Button>
                      </div>

                      {operation.parameters.map((param, paramIndex) => (
                        <Card key={paramIndex} className="relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => {
                              const operations = form.getValues("operations");
                              const currentParams =
                                operations[opIndex]?.parameters ?? [];
                              form.setValue(
                                `operations.${opIndex}.parameters`,
                                currentParams.filter(
                                  (_, idx) => idx !== paramIndex,
                                ),
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`operations.${opIndex}.parameters.${paramIndex}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`operations.${opIndex}.parameters.${paramIndex}.parameterLocation`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <Select
                                      value={field.value}
                                      onValueChange={field.onChange}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem
                                          value={ParameterLocation.QUERY}
                                        >
                                          Query
                                        </SelectItem>
                                        <SelectItem
                                          value={ParameterLocation.HEADER}
                                        >
                                          Header
                                        </SelectItem>
                                        <SelectItem
                                          value={ParameterLocation.PATH}
                                        >
                                          Path
                                        </SelectItem>
                                        <SelectItem
                                          value={ParameterLocation.COOKIE}
                                        >
                                          Cookie
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`operations.${opIndex}.parameters.${paramIndex}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex items-center space-x-2">
                              <FormField
                                control={form.control}
                                name={`operations.${opIndex}.parameters.${paramIndex}.required`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Required
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`operations.${opIndex}.parameters.${paramIndex}.deprecated`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Deprecated
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`operations.${opIndex}.parameters.${paramIndex}.schemaJson`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Schema</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="JSON schema"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel>Responses</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const operations = form.getValues("operations");
                            const currentResponses =
                              operations[opIndex]?.responses ?? [];
                            form.setValue(`operations.${opIndex}.responses`, [
                              ...currentResponses,
                              {
                                id: crypto.randomUUID(),
                                statusCode: 200,
                                description: "",
                                contentJson: "{}",
                                headersJson: null,
                              },
                            ]);
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Add Response
                        </Button>
                      </div>

                      {operation.responses.map((response, resIndex) => (
                        <Card key={resIndex} className="relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => {
                              const operations = form.getValues("operations");
                              const currentResponses =
                                operations[opIndex]?.responses ?? [];
                              form.setValue(
                                `operations.${opIndex}.responses`,
                                currentResponses.filter(
                                  (_, idx) => idx !== resIndex,
                                ),
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`operations.${opIndex}.responses.${resIndex}.statusCode`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status Code</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(Number(e.target.value))
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`operations.${opIndex}.responses.${resIndex}.description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`operations.${opIndex}.responses.${resIndex}.contentJson`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Content</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="JSON content"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`operations.${opIndex}.responses.${resIndex}.headersJson`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Headers</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="JSON headers"
                                      value={field.value ?? ""}
                                      onChange={(e) =>
                                        field.onChange(e.target.value || null)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/service/${params.serviceId as string}/${params.versionId as string}/${endpointId}`,
                  )
                }
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
