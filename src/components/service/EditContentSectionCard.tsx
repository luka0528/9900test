"use client";

import { CardContent, CardFooter } from "../ui/card";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";

import { CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { type ServiceContent, type ContentTableRow } from "@prisma/client";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { PlusCircle } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { z } from "zod";
import { api } from "~/trpc/react";
import { createId } from "@paralleldrive/cuid2";
import { useState, useEffect } from "react";

export default function EditContentSectionCard(
  content: ServiceContent & { rows: ContentTableRow[] },
) {
  const [isDirtyContent, setIsDirtyContent] = useState(false);
  const { mutate: deleteRow } = api.version.deleteRow.useMutation();
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: content,
  });

  const removeTableRow = (rowId: string) => {
    form.setValue(
      `rows`,
      form.getValues(`rows`).filter((row) => row.id !== rowId),
    );
    deleteRow({
      contentId: content.id,
      rowId,
    });
  };

  const addTableRow = () => {
    form.setValue(`rows`, [
      ...form.getValues(`rows`),
      { id: createId(), description: "", routeName: "" },
    ]);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };

  // Assuming your form is using React Hook Form
  // Add this effect to track changes
  useEffect(() => {
    // Get the current form values
    const currentValues = form.getValues();

    // Compare with original content
    const isChanged =
      // Check if title has changed
      currentValues.title !== content.title ||
      // Check if description has changed
      currentValues.description !== content.description ||
      // Check if rows have changed - length first for quick check
      currentValues.rows.length !== content.rows.length ||
      // Check if any existing row has changed
      currentValues.rows.some((row, index) => {
        // If we have more rows in the form than original, something changed
        if (index >= content.rows.length) return true;

        // Compare individual row fields
        return (
          row.routeName !== content.rows[index]?.routeName ||
          row.description !== content.rows[index]?.description
        );
      });

    setIsDirtyContent(isChanged);

    // Subscribe to form changes to detect changes
  }, [form, content]);

  // Alternative approach using form.formState
  useEffect(() => {
    // This relies on React Hook Form's built-in dirty state tracking
    setIsDirtyContent(form.formState.isDirty);
  }, [form.formState.isDirty]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <FormField
              control={form.control}
              name={`title`}
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
                  name={`description`}
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
                            name={`rows.${rowIndex}.routeName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Method/Code" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`rows.${rowIndex}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Description" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTableRow(row.id)}
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
                      onClick={() => addTableRow()}
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
                name={`description`}
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

          <CardFooter>
            <Button type="submit" disabled={!isDirtyContent}>
              Save
            </Button>
          </CardFooter>
        </form>
      </Form>
    </>
  );
}
