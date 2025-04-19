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
import { Plus, Trash2, X, PlusCircle, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { GoBackSideBar } from "~/components/sidebar/GoBackSideBar";
import React from "react";
import { ChangeLogPointType } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";

// Define form schema with consistent structure
const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description must be at least 1 characters.",
  }),
  version: z.string().min(1, {
    message: "Version is required (e.g. 1.0).",
  }),
  contents: z
    .array(
      z.object({
        title: z.string().min(2),
        description: z.string().default(""),
        endpoints: z
          .array(
            z.object({
              path: z.string(),
              description: z.string(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
  changelogPoints: z
    .array(
      z.object({
        type: z.nativeEnum(ChangeLogPointType),
        description: z.string(),
      }),
    )
    .default([]),
});

export default function AddServicePage() {
  const router = useRouter();
  const { serviceId: rawServiceId } = useParams();
  const serviceId = rawServiceId as string;
  const { data: service } = api.service.getServiceById.useQuery(serviceId);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      version: "",
      contents: [
        {
          title: "",
          description: "",
          endpoints: [],
        },
      ],
      changelogPoints: [],
    },
  });

  // Update form values when service data is loaded
  useEffect(() => {
    if (service && service.versions.length > 0) {
      // Get latest version (should be the first one due to orderBy in the query)
      const latestVersion = service.versions[0];

      if (!latestVersion) return;

      // Increment version number (simple example - you might want more sophisticated logic)
      const currentVersion = latestVersion.version;
      const versionParts = currentVersion.split(".");
      const lastPart = parseInt(versionParts[versionParts.length - 1] ?? "1.0");
      versionParts[versionParts.length - 1] = (lastPart + 1).toString();
      const suggestedVersion = versionParts.join(".");

      // Prepare content data
      const contents = latestVersion.contents.map((content) => ({
        title: content.title,
        description: content.description,
        endpoints: content.endpoints.map((endpoint) => ({
          path: endpoint.path,
          description: endpoint.description,
        })),
      }));

      // Update form with values from latest version
      form.reset({
        description: latestVersion.description,
        version: suggestedVersion,
        contents:
          contents.length > 0
            ? contents
            : [
                {
                  title: "",
                  description: "",
                  endpoints: [],
                },
              ],
      });
    }
  }, [service, form]);

  // tRPC
  const { mutate: createVersion, isPending: isCreatingVersion } =
    api.version.create.useMutation({
      onSuccess: ({ id: versionId }) => {
        toast.success("Version created successfully");
        router.push(`/service/${serviceId}/${versionId}`);
      },
      onError: (error) => {
        toast.error("Failed to create version", {
          description: error.message,
        });
      },
    });

  // Add a new detail section (text or table)
  const addDetail = (type: "text" | "table") => {
    const contents = form.getValues("contents") ?? [];

    if (type === "table") {
      form.setValue("contents", [
        ...contents,
        {
          title: "",
          description: "",
          endpoints: [{ path: "", description: "" }],
        },
      ]);
    } else {
      form.setValue("contents", [
        ...contents,
        {
          title: "",
          description: "",
          endpoints: [],
        },
      ]);
    }
  };

  // Add a row to a table
  const addTableRow = (contentIndex: number) => {
    const contents = form.getValues("contents");
    const content = contents[contentIndex] ?? {
      title: "",
      description: "",
      endpoints: [],
    };

    const updatedContents = [...contents];
    updatedContents[contentIndex] = {
      ...content,
      endpoints: [...content.endpoints, { path: "", description: "" }],
    };

    form.setValue("contents", updatedContents);
  };

  // Remove a row from a table
  const removeTableRow = (contentIndex: number, rowIndex: number) => {
    const contents = form.getValues("contents");
    const content = contents[contentIndex] ?? {
      title: "",
      description: "",
      endpoints: [],
    };

    if (content.endpoints.length <= 1) return; // Keep at least one row

    const updatedContents = [...contents];
    updatedContents[contentIndex] = {
      ...content,
      endpoints: content.endpoints.filter((_, idx) => idx !== rowIndex),
    };

    form.setValue("contents", updatedContents);
  };

  // Remove a detail section
  const removeDetail = (index: number) => {
    const contents = form.getValues("contents");
    form.setValue(
      "contents",
      contents.filter((_, idx) => idx !== index),
    );
  };

  // Add a change log point
  const addChangeLogPoint = () => {
    const changelogPoints = form.getValues("changelogPoints") ?? [];

    form.setValue("changelogPoints", [
      ...changelogPoints,
      {
        type: ChangeLogPointType.ADDED,
        description: "",
      },
    ]);
  };

  // Remove a change log point
  const removeChangeLogPoint = (changelogPointIndex: number) => {
    const changelogPoints = form.getValues("changelogPoints");
    form.setValue(
      "changelogPoints",
      changelogPoints.filter((_, idx) => idx !== changelogPointIndex),
    );
  };

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    createVersion({
      serviceId,
      versionDescription: values.description,
      newVersion: values.version,
      contents: values.contents,
      changelogPoints: values.changelogPoints,
    });
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <GoBackSideBar />
      <div className="flex h-full grow flex-col overflow-y-auto p-6">
        <h1 className="text-2xl font-bold">Add New Version</h1>
        <p className="mb-6 text-muted-foreground">
          Add a new version to {service?.name}. We&apos;ve pre-filled the form
          with your latest version.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Service Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a description for your service"
                      className="min-h-24 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Briefly describe what your service offers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Version Field*/}
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input placeholder="1.0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Specify the version of your service (e.g. 1.0, 2.1.3).
                    We&apos;ve provided a suggested version based on your latest
                    version.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-lg">Content Sections</FormLabel>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addDetail("text")}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Text
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addDetail("table")}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Table
                  </Button>
                </div>
              </div>

              {form.watch("contents")?.map((content, contentIndex) => (
                <Card key={contentIndex} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => removeDetail(contentIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <CardHeader>
                    <FormField
                      control={form.control}
                      name={`contents.${contentIndex}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Section title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardHeader>

                  <CardContent>
                    {content.endpoints.length > 0 ? (
                      // Table content
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`contents.${contentIndex}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Table Description</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Brief description for the table"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="rounded-md border">
                          <div className="bg-muted px-4 py-2 font-medium">
                            Table Rows
                          </div>
                          <div className="p-4">
                            {content.endpoints.map(
                              (endpoint, endpointIndex) => (
                                <div
                                  key={endpointIndex}
                                  className="mb-4 grid grid-cols-[1fr_auto] gap-4"
                                >
                                  <div className="flex gap-4">
                                    <FormField
                                      control={form.control}
                                      name={`contents.${contentIndex}.endpoints.${endpointIndex}.path`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input
                                              placeholder="Path"
                                              {...field}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`contents.${contentIndex}.endpoints.${endpointIndex}.description`}
                                      render={({ field }) => (
                                        <FormItem className="flex-1">
                                          <FormControl>
                                            <Input
                                              placeholder="Description"
                                              {...field}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeTableRow(
                                        contentIndex,
                                        endpointIndex,
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ),
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => addTableRow(contentIndex)}
                            >
                              <PlusCircle className="mr-1 h-4 w-4" />
                              Add Row
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Text content
                      <FormField
                        control={form.control}
                        name={`contents.${contentIndex}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter content"
                                className="min-h-32 resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Change Log Points */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-lg">Change Log Points</FormLabel>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addChangeLogPoint()}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Change Log Point
                  </Button>
                </div>
              </div>
              {form.watch("changelogPoints")?.map((changelogPoint, index) => (
                <div key={index} className="flex w-full gap-2">
                  <FormField
                    control={form.control}
                    name={`changelogPoints.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="w-36">
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-fit border-none shadow-none transition-all duration-200 hover:bg-gray-100">
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ChangeLogPointType.ADDED}>
                                <Badge variant="added">Added</Badge>
                              </SelectItem>
                              <SelectItem value={ChangeLogPointType.CHANGED}>
                                <Badge variant="changed">Changed</Badge>
                              </SelectItem>
                              <SelectItem value={ChangeLogPointType.DEPRECATED}>
                                <Badge variant="deprecated">Deprecated</Badge>
                              </SelectItem>
                              <SelectItem value={ChangeLogPointType.REMOVED}>
                                <Badge variant="removed">Removed</Badge>
                              </SelectItem>
                              <SelectItem value={ChangeLogPointType.FIXED}>
                                <Badge variant="fixed">Fixed</Badge>
                              </SelectItem>
                              <SelectItem value={ChangeLogPointType.SECURITY}>
                                <Badge variant="security">Security</Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`changelogPoints.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Textarea
                            className="flex-1"
                            placeholder="Enter a description for the change log point"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChangeLogPoint(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/service")}
                disabled={isCreatingVersion}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingVersion}>
                {isCreatingVersion ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create new version"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
