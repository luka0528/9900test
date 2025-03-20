"use client";

import { useState, useEffect } from "react";
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
import { Plus, Trash2, X, PlusCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

import { AddServiceSidebar } from "../../../components/service/AddServiceSidebar";

// Import or define your dummy data
const dummy_data = {
  name: "Service 1",
  description: "This is a service and it does thins.",
  version: "1.0",
  tags: ["meow", "woof", "fish", "glizzy"],
  details: [
    {
      title: "What is Lorem Ipsum?",
      content: "nothing here yet",
      table: [],
    },
    {
      title: "Where does it come from?",
      content: "Ad iaculis lectus senectus sapien nisl sem.",
      table: [
        { code: "Code 1", description: "Description 1" },
        { code: "Code 2", description: "Description 2" },
        { code: "Code 3", description: "Description 3" },
      ],
    },
    {
      title: "Code Table",
      content: "",
      table: [
        { code: "Meow", description: "Cat" },
        { code: "Woof", description: "Dog" },
        { code: "Fish", description: "Fish" },
        { code: "Glizzy", description: "Hot Dog" },
      ],
    },
  ],
};

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
  name: z.string().min(2, {
    message: "Service name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  version: z.string().min(1, {
    message: "Version is required (e.g. 1.0).",
  }),
  tags: z.array(z.string()).default([]),
  details: z.array(
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
  ),
});

export default function EditServicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");

  // Initialize the form with dummy data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: dummy_data.name,
      description: dummy_data.description,
      version: dummy_data.version,
      tags: dummy_data.tags,
      details: dummy_data.details,
    },
  });

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

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    alert("Service updated successfully!");
    router.push("/service");
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <AddServiceSidebar />
      <div className="flex h-full grow flex-col overflow-y-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Edit Service</h1>

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

            {/* Version Field */}
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 1.0" {...field} />
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
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit">Update Service</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
