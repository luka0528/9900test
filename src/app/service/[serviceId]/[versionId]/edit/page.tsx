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
import { z } from "zod";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { createId } from "@paralleldrive/cuid2";
import { GoBackSideBar } from "~/components/sidebar/GoBackSideBar";
import { ChangeLogPointType, RestMethod } from "@prisma/client";
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
              method: z.nativeEnum(RestMethod),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
  changelogPoints: z
    .array(
      z.object({
        id: z.string(),
        type: z.nativeEnum(ChangeLogPointType),
        description: z.string(),
      }),
    )
    .default([]),
});

interface DocumentationData {
  description: string;
  contents: Array<{
    id: string;
    title: string;
    description: string;
    rows: Array<{
      id: string;
      routeName: string;
      description: string;
      method: RestMethod;
    }>;
  }>;
  changelogPoints: Array<{
    id: string;
    type: ChangeLogPointType;
    description: string;
  }>;
}

export default function EditServicePage() {
  const router = useRouter();
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
      changelogPoints: [],
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (versionData) {
      // Set form values from loaded data
      const data = versionData as DocumentationData;
      form.reset({
        description: versionData.description || "",
        contents:
          data.contents?.map((content) => ({
            id: content.id,
            title: content.title || "",
            description: content.description || "",
            rows:
              content.rows?.map((row) => ({
                id: row.id,
                routeName: row.routeName || "",
                description: row.description || "",
                method: row.method || RestMethod.GET,
              })) || [],
          })) || [],
        changelogPoints: versionData.changelogPoints || [],
      });
    }
  }, [versionData, form]);

  const { mutate: editVersion, isPending: isEditing } =
    api.version.editVersion.useMutation({
      onSuccess: () => {
        toast.success("Your changes have been saved");
        void utils.version.getDocumentationByVersionId.invalidate({
          versionId: versionId,
        });
        void utils.service.getAllVersionChangelogs.invalidate({
          serviceId: serviceId,
        });
        router.push(`/service/${serviceId}/${versionId}`);
      },
      onError: () => {
        toast.error("Failed to update service", {
          description: "There was an error updating your service.",
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
          rows: [
            {
              id: createId(),
              routeName: "",
              description: "",
              method: RestMethod.GET,
            },
          ],
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
        {
          id: createId(),
          routeName: "",
          description: "",
          method: RestMethod.GET,
        },
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

  // Add a change log point
  const addChangeLogPoint = () => {
    const changelogPoints = form.getValues("changelogPoints") ?? [];
    form.setValue("changelogPoints", [
      ...changelogPoints,
      {
        id: createId(),
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
  async function onSubmit(values: z.infer<typeof formSchema>) {
    editVersion({
      versionId,
      newDescription: values.description,
      contents: values.contents,
      changelogPoints: values.changelogPoints,
    });
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <GoBackSideBar />
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
                                <div className="flex gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`contents.${contentIndex}.rows.${rowIndex}.method`}
                                    render={({ field }) => (
                                      <FormItem className="w-36">
                                        <FormControl>
                                          <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select a method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem
                                                value={RestMethod.GET}
                                              >
                                                GET
                                              </SelectItem>
                                              <SelectItem
                                                value={RestMethod.POST}
                                              >
                                                POST
                                              </SelectItem>
                                              <SelectItem
                                                value={RestMethod.PUT}
                                              >
                                                PUT
                                              </SelectItem>
                                              <SelectItem
                                                value={RestMethod.DELETE}
                                              >
                                                DELETE
                                              </SelectItem>
                                              <SelectItem
                                                value={RestMethod.PATCH}
                                              >
                                                PATCH
                                              </SelectItem>
                                              <SelectItem
                                                value={RestMethod.HEAD}
                                              >
                                                HEAD
                                              </SelectItem>
                                              <SelectItem
                                                value={RestMethod.OPTIONS}
                                              >
                                                OPTIONS
                                              </SelectItem>
                                              <SelectItem
                                                value={RestMethod.TRACE}
                                              >
                                                TRACE
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
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
