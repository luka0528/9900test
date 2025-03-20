"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";

import { AddServiceSidebar } from "~/components/service/AddServiceSidebar";

// Define form schema with consistent structure
const formSchema = z.object({
  title: z.string().min(1, {
    message: "Service title must be at least 1 characters.",
  }),
  description: z.string().min(1, {
    message: "Description must be at least 1 characters.",
  }),
  version: z.string().min(1, {
    message: "Version is required (e.g. 1.0).",
  }),
  tags: z.array(z.string()).default([]),
  contents: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().default(""),
      rows: z
        .array(
          z.object({
            routeName: z.string(),
            description: z.string(),
          }),
        )
        .default([]),
    }),
  ),
});

export default function EditServicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { serviceId: rawServiceId } = useParams();
  const serviceId = rawServiceId as string;

  const { toast } = useToast();

  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = api.useUtils();

  // Initialize API hooks
  const upsertVersionCall = api.version.upsertDocumentation.useMutation({
    onSuccess: () => {
      void utils.service.getServiceById.invalidate(serviceId);
      router.push(`/service/${serviceId}`);
    },
  });
  const addTagCall = api.service.addTag.useMutation();

  // Fetch service data from API
  const {
    data: service,
    isLoading: serviceLoading,
    error: serviceError,
  } = api.service.getServiceById.useQuery(serviceId, {
    enabled: !!serviceId,
  });

  // Find the current version
  const currentVersion =
    service?.versions[service.versions.length - 1]?.version;

  // Fetch documentation for the current version
  const {
    data: versionData,
    isLoading: versionLoading,
    error: versionError,
  } = api.version.getDocumentation.useQuery(
    {
      serviceId: serviceId,
      serviceVersion: currentVersion ?? "",
    },
    {
      enabled: !!serviceId && !!currentVersion,
      retry: 1,
    },
  );

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      version: "",
      tags: [],
      contents: [],
    },
  });

  // Populate form once data is loaded
  useEffect(() => {
    if (service && versionData && !isSubmitting) {
      const contents =
        versionData.contents.map((content) => {
          const tableRows =
            content.rows?.map((row) => ({
              code: row.routeName,
              description: row.description,
              rowId: row.id,
            })) || [];

          return {
            title: content.title,
            content: content.description,
            contentId: content.id,
            table: tableRows,
          };
        }) || [];

      form.reset({
        title: service.name,
        description: versionData.description,
        version: currentVersion ?? "",
        tags: service.tags.map((tag) => tag.name),
        contents: contents,
      });

      setIsLoading(false);
    }
  }, [service, versionData, form, currentVersion, isSubmitting]);

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
    const contents = form.getValues("contents") || [];

    if (type === "table") {
      form.setValue("contents", [
        ...contents,
        {
          title: "",
          description: "",
          rows: [{ routeName: "", description: "" }],
        },
      ]);
    } else {
      form.setValue("contents", [
        ...contents,
        {
          title: "",
          description: "",
          rows: [],
        },
      ]);
    }
  };

  // Add a row to a table
  const addTableRow = (detailIndex: number) => {
    const contents = form.getValues("contents");
    const content = contents[detailIndex] ?? {
      title: "",
      description: "",
      rows: [],
    };
    const currentTable = content.rows ?? [];

    const updatedContents = [...contents];
    updatedContents[detailIndex] = {
      ...content,
      rows: [...currentTable, { routeName: "", description: "" }],
    };

    form.setValue("contents", updatedContents);
  };

  // Remove a row from a table
  const removeTableRow = (detailIndex: number, rowIndex: number) => {
    const contents = form.getValues("contents");
    const content = contents[detailIndex] ?? {
      title: "",
      description: "",
      rows: [],
    };
    const currentTable = content.rows ?? [];

    if (currentTable.length <= 1) return;

    const updatedContents = [...contents];
    updatedContents[detailIndex] = {
      ...content,
      rows: currentTable.filter((_, idx) => idx !== rowIndex),
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

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session?.user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to edit a service",
        variant: "destructive",
      });
      return;
    }

    if (!serviceId) {
      toast({
        title: "Error",
        description: "Service ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: EDIT TAGS
      // Handle tags
      if (values.tags && values.tags.length > 0) {
        if (service?.tags) {
          const newTags = values.tags.filter(
            (tag) => !service.tags.some((t) => t.name === tag),
          );

          for (const tag of newTags) {
            await addTagCall.mutateAsync({
              serviceId: serviceId,
              tag: tag,
            });
          }
        }
      }

      // Update version documentation
      await upsertVersionCall.mutateAsync({
        serviceId: serviceId,
        serviceVersion: values.version,
        versionDescription: values.description,
        contents: values.contents.map((content) => ({
          contentId: content.contentId,
          title: content.title,
          description: content.description,
          rows: content.rows,
        })),
      });

      toast({
        title: "Success!",
        description: "Service updated successfully",
      });
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update service",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle loading state
  if (isLoading || serviceLoading || versionLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle error state
  if (serviceError || versionError || !service || !versionData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">
            Error Loading Service
          </h2>
          <p className="mt-2 text-muted-foreground">
            Could not load service data. Please try again.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/service/${serviceId}`)}
          >
            Back to Service
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AddServiceSidebar />
      <div className="flex h-full grow flex-col overflow-y-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Edit Service</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Service Name (read-only) */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter service name"
                      {...field}
                      disabled
                    />
                  </FormControl>
                  <FormDescription>
                    Service name cannot be changed once created.
                  </FormDescription>
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

            {/* Version Field (read-only) */}
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 1.0" {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    Version number cannot be changed once created.
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
                    {content.rows.length > 0 ? (
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
                            {content.rows.map((row, rowIndex) => (
                              <div
                                key={rowIndex}
                                className="mb-4 grid grid-cols-[1fr_auto] gap-4"
                              >
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`contents.${contentIndex}.rows.${rowIndex}.routeName`}
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
                                    name={`contents.${contentIndex}.rows.${rowIndex}.description`}
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
                                    removeTableRow(contentIndex, rowIndex)
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

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/service/${serviceId}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Service"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
