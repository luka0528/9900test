"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
import { z } from "zod";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";
import { createId } from "@paralleldrive/cuid2";

import { AddServiceSidebar } from "~/components/service/AddServiceSidebar";

// Define form schema with consistent structure
const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description must be at least 1 characters.",
  }),
  contents: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(2),
        description: z.string().default(""),
        rows: z
          .array(
            z.object({
              id: z.string(),
              routeName: z.string(),
              description: z.string(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});

export default function EditServicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { serviceId: serviceIdParam, versionId: versionIdParam } = useParams();
  const versionId = versionIdParam as string;
  const serviceId = serviceIdParam as string;
  const utils = api.useUtils();

  const { data: versionData } =
    api.version.getDocumentationByVersionId.useQuery({
      versionId: versionId,
    });

  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Set empty defaults initially
      description: "",
      contents: [],
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (versionData) {
      // Set form values from loaded data
      form.reset({
        description: versionData.description || "",
        contents:
          versionData.contents?.map((content) => ({
            id: content.id,
            title: content.title || "",
            description: content.description || "",
            rows:
              content.rows?.map((row) => ({
                id: row.id,
                routeName: row.routeName || "",
                description: row.description || "",
              })) || [],
          })) || [],
      });
    }
  }, [versionData, form]);

  // tRPC
  const { mutate: editVersion, isPending: isEditing } =
    api.version.editVersion.useMutation({
      onSuccess: () => {
        toast({
          title: "Success!",
          description: "Service updated successfully",
        });
        void utils.version.getDocumentationByVersionId.invalidate({
          versionId: versionId,
        });
      },
      onError: (error) => {
        toast({
          title: "Error!",
          description: "Failed to update service",
          variant: "destructive",
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
          id: createId(),
          title: "",
          description: "",
          rows: [{ id: createId(), routeName: "", description: "" }],
        },
      ]);
    } else {
      form.setValue("contents", [
        ...contents,
        {
          id: createId(),
          title: "",
          description: "",
          rows: [],
        },
      ]);
    }
  };

  // Add a row to a table
  const addTableRow = (contentIndex: number) => {
    const contents = form.getValues("contents");
    const content = contents[contentIndex] ?? {
      id: createId(),
      title: "",
      description: "",
      rows: [],
    };

    const updatedContents = [...contents];
    updatedContents[contentIndex] = {
      ...content,
      rows: [
        ...content.rows,
        { id: createId(), routeName: "", description: "" },
      ],
    };

    form.setValue("contents", updatedContents);
  };

  // Remove a row from a table
  const removeTableRow = (contentIndex: number, rowIndex: number) => {
    const contents = form.getValues("contents");
    const content = contents[contentIndex] ?? {
      id: createId(),
      title: "",
      description: "",
      rows: [],
    };

    if (content.rows.length <= 1) return; // Keep at least one row

    const updatedContents = [...contents];
    updatedContents[contentIndex] = {
      ...content,
      rows: content.rows.filter((_, idx) => idx !== rowIndex),
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
    editVersion({
      versionId,
      newDescription: values.description,
      contents: values.contents,
    });
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AddServiceSidebar />
      <div className="flex h-full grow flex-col overflow-y-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Edit Service</h1>

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

            <Separator />

            {/* Content Sections */}
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
                onClick={() =>
                  router.push(`/service/${serviceId}/${versionId}`)
                }
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? (
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
