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
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { X, Loader2, Plus, Trash2, PlusCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { GoBackSideBar } from "~/components/sidebar/GoBackSideBar";
import { createId } from "@paralleldrive/cuid2";

// Define form schema with consistent structure
const formSchema = z.object({
  name: z.string().min(1, {
    message: "Service name must be at least 1 characters.",
  }),
  tags: z.array(z.string()).default([]),
  subscriptionTiers: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      price: z.number().min(0),
      features: z.array(z.string()).default([]),
    }),
  ),
  baseEndpoint: z.string().min(1, {
    message: "Base endpoint must be at least 1 characters.",
  }),
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
      subscriptionTiers: [],
      baseEndpoint: "",
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        tags: service.tags.map((tag) => tag.name),
        subscriptionTiers: service.subscriptionTiers.map((tier) => ({
          id: tier.id,
          name: tier.name,
          price: tier.price,
          features: tier.features.map((feature) => feature.feature),
        })),
        baseEndpoint: service.baseEndpoint,
      });
    }
  }, [service, form]);

  const { mutate: updateService, isPending: isUpdating } =
    api.service.updateServiceMetadata.useMutation({
      onSuccess: () => {
        toast.success("Service updated successfully");
        void utils.service.getServiceById.invalidate(serviceId);
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

  // Add a subscription tier
  const addSubscriptionTier = () => {
    const subscriptionTiers = form.getValues("subscriptionTiers") ?? [];
    if (subscriptionTiers.length >= 3) {
      toast.error("You can only have up to 3 subscription tiers");
      return;
    }
    form.setValue("subscriptionTiers", [
      ...subscriptionTiers,
      {
        id: createId(),
        name: "",
        price: 0,
        features: ["Feature 1", "Feature 2", "Feature 3"],
      },
    ]);
  };

  // Remove a subscription tier
  const removeSubscriptionTier = (index: number) => {
    const subscriptionTiers = form.getValues("subscriptionTiers");
    if (subscriptionTiers.length <= 1) {
      toast.error("You must have at least one subscription tier");
      return;
    }
    form.setValue(
      "subscriptionTiers",
      subscriptionTiers.filter((_, idx) => idx !== index),
    );
  };

  // Add a feature to a subscription tier
  const addFeature = (tierIndex: number) => {
    const subscriptionTiers = form.getValues("subscriptionTiers");
    const tier = subscriptionTiers[tierIndex] ?? {
      name: "",
      price: 0,
      features: [],
    };
    form.setValue(`subscriptionTiers.${tierIndex}.features`, [
      ...tier.features,
      "",
    ]);
  };

  // Remove a feature from a subscription tier
  const removeFeature = (tierIndex: number, featureIndex: number) => {
    const subscriptionTiers = form.getValues("subscriptionTiers");
    const tier = subscriptionTiers[tierIndex] ?? {
      name: "",
      price: 0,
      features: [],
    };
    if (tier.features.length <= 1) {
      toast.error("You must have at least one feature");
      return;
    }
    form.setValue(
      `subscriptionTiers.${tierIndex}.features`,
      tier.features.filter((_, idx) => idx !== featureIndex),
    );
  };

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    updateService({
      serviceId,
      newName: values.name,
      tags: values.tags,
      subscriptionTiers: values.subscriptionTiers,
      baseEndpoint: values.baseEndpoint,
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

            {/* Base Endpoint */}
            <FormField
              control={form.control}
              name="baseEndpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Endpoint</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter base endpoint" {...field} />
                  </FormControl>
                  <FormDescription>
                    The base endpoint for your service.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Subscription Tiers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-lg">Subscription Tiers</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubscriptionTier}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Tier
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {form
                  .watch("subscriptionTiers")
                  ?.sort((a, b) => a.price - b.price)
                  .map((tier, tierIndex) => (
                    <Card key={tierIndex} className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => removeSubscriptionTier(tierIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <CardHeader>
                        <FormField
                          control={form.control}
                          name={`subscriptionTiers.${tierIndex}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter tier name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`subscriptionTiers.${tierIndex}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Enter price"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.valueAsNumber)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="w-full space-y-2">
                          <FormLabel>Features</FormLabel>
                          {tier.features.map((feature, featureIndex) => (
                            <div
                              key={featureIndex}
                              className="flex items-center gap-2"
                            >
                              <FormField
                                control={form.control}
                                name={`subscriptionTiers.${tierIndex}.features.${featureIndex}`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input
                                        placeholder="Enter feature"
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
                                onClick={() =>
                                  removeFeature(tierIndex, featureIndex)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addFeature(tierIndex)}
                        >
                          <PlusCircle className="mr-1 h-4 w-4" />
                          Add Feature
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

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
