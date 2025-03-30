"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "~/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { GoBackSideBar } from "~/components/sidebar/GoBackSideBar";

// Define form schema with consistent structure
const formSchema = z.object({
  name: z.string().min(1, {
    message: "Service name must be at least 1 characters.",
  }),
  tags: z.array(z.string()).default([]),
});

export default function AddServicePage() {
  const { serviceId: rawServiceId } = useParams();
  const serviceId = rawServiceId as string;
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");
  const utils = api.useUtils();

  const { data: service } = api.service.getServiceMetadataById.useQuery({
    serviceId,
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        tags: service.tags.map((tag) => tag.name),
      });
    }
  }, [service, form]);

  const { mutate: updateService, isPending: isUpdating } =
    api.service.updateServiceMetadata.useMutation({
      onSuccess: () => {
        toast.success("Service updated successfully");
        void utils.service.getServiceMetadataById.invalidate({ serviceId });
        router.push(`/service/${serviceId}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  // Add a tag
  const addTag = () => {
    if (tagInput.trim() === "") return;
    const currentTags = form.getValues("tags") ?? [];
    if (!currentTags.includes(tagInput.trim())) {
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Remove a tag
  const removeTag = (tag: string) => {
    const currentTags = form.getValues("tags") ?? [];
    form.setValue(
      "tags",
      currentTags.filter((t) => t !== tag),
    );
  };

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    updateService({
      serviceId,
      newName: values.name,
      tags: values.tags,
    });
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <GoBackSideBar />
      <div className="flex h-full grow flex-col overflow-y-auto p-6">
        <h1 className="text-2xl font-bold">Edit Service Content</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Edit non-version specific service metadata.
        </p>

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

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/service/${serviceId}`)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
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
