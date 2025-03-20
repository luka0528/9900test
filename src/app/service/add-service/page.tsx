"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Badge } from "~/components/ui/badge";
import { Plus, Trash2, X, PlusCircle, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

import { AddServiceSidebar } from "~/components/service/AddServiceSidebar";

// Define interfaces for better type safety
interface TableRow {
  code: string;
  description: string;
}

interface DetailItem {
  title: string;
  content: string;
  table: TableRow[];
}

// Define form schema with consistent structure
const formSchema = z.object({
  name: z.string().min(1, {
    message: "Service name must be at least 1 characters.",
  }),
  description: z.string().min(1, {
    message: "Description must be at least 1 characters.",
  }),
  version: z.string().min(1, {
    message: "Version is required (e.g. 1.0).",
  }),
  tags: z.array(z.string()).default([]),
  details: z
    .array(
      z.object({
        title: z.string().min(2),
        content: z.string().default(""),
        table: z
          .array(
            z.object({
              code: z.string(),
              description: z.string(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});

export default function AddServicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      version: "",
      tags: [],
      details: [
        {
          title: "",
          content: "",
          table: [],
        },
      ],
    },
  });

  // tRPC
  const createServiceCall = api.service.create.useMutation();
  const addTagCall = api.service.addTag.useMutation();
  const createVersionCall = api.version.create.useMutation();

  // Add a tag
  const addTag = () => {
    if (tagInput.trim() === "") return;

    const currentTags = form.getValues("tags") || [];
    if (!currentTags.includes(tagInput.trim())) {
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Remove a tag
  const removeTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((t) => t !== tag),
    );
  };

  // Add a new detail section (text or table)
  const addDetail = (type: "text" | "table") => {
    const details = form.getValues("details") || [];

    if (type === "table") {
      form.setValue("details", [
        ...details,
        {
          title: "",
          content: "",
          table: [{ code: "", description: "" }],
        },
      ]);
    } else {
      form.setValue("details", [
        ...details,
        {
          title: "",
          content: "",
          table: [],
        },
      ]);
    }
  };

  // Add a row to a table
  const addTableRow = (detailIndex: number) => {
    const details = form.getValues("details");
    const detail = details[detailIndex] as any;
    const currentTable = detail.table;

    const updatedDetails = [...details];
    updatedDetails[detailIndex] = {
      ...detail,
      table: [...currentTable, { code: "", description: "" }],
    };

    form.setValue("details", updatedDetails);
  };

  // Remove a row from a table
  const removeTableRow = (detailIndex: number, rowIndex: number) => {
    const details = form.getValues("details");
    const detail = details[detailIndex] as any;
    const currentTable = detail.table;

    if (currentTable.length <= 1) return; // Keep at least one row

    const updatedDetails = [...details];
    updatedDetails[detailIndex] = {
      ...detail,
      table: currentTable.filter((_: any, idx: number) => idx !== rowIndex),
    };

    form.setValue("details", updatedDetails);
  };

  // Remove a detail section
  const removeDetail = (index: number) => {
    const details = form.getValues("details");
    form.setValue(
      "details",
      details.filter((_, idx) => idx !== index),
    );
  };

  // Transform form data to match API format
  const transformDataForAPI = (values: z.infer<typeof formSchema>) => {
    // First create the contents array for the version API
    const contents = values.details.map((detail) => {
      // Convert table format to technical rows
      const technicalRows = detail.table.map((row) => ({
        routeName: row.code,
        routeDocu: row.description,
      }));

      return {
        title: detail.title,
        nonTechnicalDocu: detail.content,
        technicalRows: technicalRows,
      };
    });

    return {
      serviceName: values.name,
      serviceDescription: values.description,
      version: values.version,
      tags: values.tags,
      contents: contents,
    };
  };

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session?.user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a service",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const transformedData = transformDataForAPI(values);

      // Step 1: Create the service
      const service = await createServiceCall.mutateAsync({
        name: transformedData.serviceName,
      });

      // Step 2: Add all tags to the service
      if (transformedData.tags.length > 0) {
        // Add each tag one by one to ensure they're all processed
        for (const tag of transformedData.tags) {
          await addTagCall.mutateAsync({
            serviceId: service.id,
            tag: tag,
          });
        }
      }

      // Step 3: Create the first version with all the documentation
      await createVersionCall.mutateAsync({
        serviceId: service.id,
        newVersion: transformedData.version,
        versionDescription: transformedData.serviceDescription,
        contents: transformedData.contents,
      });

      toast({
        title: "Success!",
        description: "Service created successfully",
      });

      // Navigate to the service page
      router.push(`/service/${service.id}`);
    } catch (error) {
      console.error("Error creating service:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create service",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AddServiceSidebar />
      <div className="flex h-full grow flex-col overflow-y-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Create New Service</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Service Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter service name" {...field} />
                  </FormControl>
                  <FormDescription>The name of your service.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Specify the version of your service (e.g. 1.0, 2.1.3)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.watch("tags")?.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <FormDescription>
                Add keywords that describe your service.
              </FormDescription>
            </FormItem>

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

              {form.watch("details")?.map((detail, detailIndex) => (
                <Card key={detailIndex} className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => removeDetail(detailIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <CardHeader>
                    <FormField
                      control={form.control}
                      name={`details.${detailIndex}.title`}
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
                    {detail.table.length > 0 ? (
                      // Table content
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`details.${detailIndex}.content`}
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
                            {detail.table.map((row, rowIndex) => (
                              <div
                                key={rowIndex}
                                className="mb-4 grid grid-cols-[1fr_auto] gap-4"
                              >
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`details.${detailIndex}.table.${rowIndex}.code`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            placeholder="Method/Code"
                                            {...field}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`details.${detailIndex}.table.${rowIndex}.description`}
                                    render={({ field }) => (
                                      <FormItem>
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
                                    removeTableRow(detailIndex, rowIndex)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => addTableRow(detailIndex)}
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
                        name={`details.${detailIndex}.content`}
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

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/service")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Service"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
