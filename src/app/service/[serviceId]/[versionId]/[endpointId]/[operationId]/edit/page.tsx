"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";
import { RestMethod, ParameterLocation } from "@prisma/client";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { methodColors } from "~/lib/rest-method";
import { useEffect } from "react";
import { createId } from "@paralleldrive/cuid2";
import { toast } from "sonner";

const formSchema = z.object({
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
      headersJson: z.string(),
    }),
  ),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditOperationPage() {
  const router = useRouter();
  const params = useParams();
  const utils = api.useUtils();
  const operationId = params.operationId as string;

  const { data: operation } = api.endpoint.getOperation.useQuery({
    operationId,
  });

  const updateOperation = api.endpoint.updateOperation.useMutation({
    onSuccess: () => {
      toast.success("Operation updated successfully");
      void utils.endpoint.getEndpoint.invalidate({
        endpointId: params.endpointId as string,
      });
      void utils.service.getServiceById.invalidate(params.serviceId as string);
      router.push(
        `/service/${params.serviceId as string}/${params.versionId as string}/${params.endpointId as string}`,
      );
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      method: RestMethod.GET,
      description: "",
      deprecated: false,
      parameters: [],
      requestBody: null,
      responses: [],
    },
  });
  // Helper function to add a parameter

  const addParameter = () => {
    const parameters = form.getValues("parameters") ?? [];

    form.setValue("parameters", [
      ...parameters,
      {
        id: createId(),
        name: "",
        description: "",
        required: false,
        parameterLocation: ParameterLocation.QUERY,
        schemaJson: "{}",
        deprecated: false,
      },
    ]);
  };

  // Helper function to remove a parameter
  const removeParameter = (index: number) => {
    const parameters = form.getValues("parameters");
    form.setValue(
      "parameters",
      parameters.filter((_, idx) => idx !== index),
    );
  };

  // Helper function to add a response
  const addResponse = () => {
    const responses = form.getValues("responses") ?? [];
    form.setValue("responses", [
      ...responses,
      {
        id: createId(),
        statusCode: 200,
        description: "",
        contentJson: "{}",
        headersJson: "{}",
      },
    ]);
  };

  // Helper function to remove a response
  const removeResponse = (index: number) => {
    const responses = form.getValues("responses");
    form.setValue(
      "responses",
      responses.filter((_, idx) => idx !== index),
    );
  };

  useEffect(() => {
    if (operation) {
      form.reset({
        method: operation.method,
        description: operation.description,
        deprecated: operation.deprecated,
        parameters: operation.parameters,
        requestBody: operation.requestBody,
        responses: operation.responses,
      });
    }
  }, [operation, form]);

  function onSubmit(values: FormValues) {
    console.log(values);
    updateOperation.mutate({
      operationId,
      ...values,
    });
  }

  return (
    <div className="container mx-auto py-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Edit Operation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(RestMethod).map((method) => (
                          <SelectItem key={method} value={method}>
                            <Badge className={methodColors[method]}>
                              {method}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
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

              <FormField
                control={form.control}
                name="deprecated"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Deprecated</FormLabel>
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
                    onClick={addParameter}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Parameter
                  </Button>
                </div>

                {form.watch("parameters")?.map((param, index) => (
                  <Card key={index} className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => removeParameter(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <CardContent className="space-y-4 pt-6">
                      <FormField
                        control={form.control}
                        name={`parameters.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Parameter name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`parameters.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Parameter description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`parameters.${index}.parameterLocation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a location" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(ParameterLocation).map(
                                  (location) => (
                                    <SelectItem key={location} value={location}>
                                      {location}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center space-x-4">
                        <FormField
                          control={form.control}
                          name={`parameters.${index}.required`}
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
                          name={`parameters.${index}.deprecated`}
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
                        name={`parameters.${index}.schemaJson`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Schema</FormLabel>
                            <FormControl>
                              <Textarea placeholder="JSON schema" {...field} />
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
                    onClick={addResponse}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Response
                  </Button>
                </div>

                {form.watch("responses")?.map((response, index) => (
                  <Card key={index} className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => removeResponse(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <CardContent className="space-y-4 pt-6">
                      <FormField
                        control={form.control}
                        name={`responses.${index}.statusCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status Code</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Status code"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`responses.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Response description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`responses.${index}.contentJson`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea placeholder="JSON content" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`responses.${index}.headersJson`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Headers</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="JSON headers"
                                value={field.value ?? ""}
                                onChange={field.onChange}
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

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
