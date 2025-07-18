"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button, GlowingButton } from "~/components/ui/button";
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
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { GoBackSideBar } from "~/components/sidebar/GoBackSideBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import CodeSnippet from "~/components/ui/code-snippet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI } from "openapi-types";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Service name must be at least 1 characters.",
  }),
  description: z.string().min(1, {
    message: "Description must be at least 1 characters.",
  }),
  baseEndpoint: z.string().min(1, {
    message: "Base endpoint is required (e.g. https://api.example.com).",
  }),
  version: z.string().min(1, {
    message: "Version is required (e.g. 1.0).",
  }),
  tags: z.array(z.string()).default([]),
  subscriptionTiers: z.array(
    z.object({
      name: z.string().min(1, {
        message: "Subscription tier name must be at least 1 characters.",
      }),
      price: z.coerce
        .number()
        .min(0, "Price must be greater than or equal to 0")
        .refine((n) => !isNaN(n), "Price must be a valid number"),
      features: z.array(z.string()).default([]),
    }),
  ),
  masterAPIKey: z.string(),
  contents: z
    .array(
      z.object({
        title: z.string().default(""),
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
});

export default function AddServicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      baseEndpoint: "",
      version: "",
      tags: [],
      masterAPIKey: "",
      contents: [
        {
          title: "",
          description: "",
          endpoints: [{ path: "", description: "" }],
        },
      ],
      subscriptionTiers: [
        {
          name: "",
          price: 0,
          features: ["", "", ""],
        },
      ],
    },
  });

  // tRPC
  const { mutate: createService, isPending: isCreatingService } =
    api.service.create.useMutation({
      onSuccess: (data) => {
        toast.success("Service created successfully");
        router.push(`/service/${data.serviceId}/${data.versionId}`);
      },
      onError: (error) => {
        const errorData = JSON.parse(error.message) as Array<{
          message: string;
          path: string[];
        }>;

        errorData.forEach((err: { message: string; path: string[] }) => {
          toast.error(err.path[err.path.length - 1] + ": " + err.message);
        });
      },
    });

  const {
    mutate: createServiceFromOpenApi,
    isPending: isCreatingServiceFromOpenApi,
  } = api.autoDocs.createServiceFromOpenApi.useMutation({
    onSuccess: (data) => {
      toast.success("Service generated from OpenAPI successfully");
      const firstVersion = data.versions[0];
      router.push(`/service/${data.id}/${firstVersion?.id}`);
    },
    onError: () => {
      toast.error("Failed to create service from OpenAPI");
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

    if (content.endpoints.length <= 1) {
      toast.error("You must have at least one route in this table.");
      return;
    } // Keep at least one row

    const updatedContents = [...contents];
    updatedContents[contentIndex] = {
      ...content,
      endpoints: content.endpoints.filter((_, idx) => idx !== rowIndex),
    };

    form.setValue("contents", updatedContents);
  };

  // Remove a detail section
  const removeDetail = (index: number) => {
    if (index === 0) {
      toast.error("This section is required and cannot be removed.");
      return;
    }
    const contents = form.getValues("contents");
    form.setValue(
      "contents",
      contents.filter((_, idx) => idx !== index),
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
      { name: "", price: 0, features: ["Feature 1", "Feature 2", "Feature 3"] },
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
    createService({
      name: values.name,
      description: values.description,
      baseEndpoint: values.baseEndpoint,
      version: values.version,
      contents: values.contents,
      tags: values.tags,
      subscriptionTiers: values.subscriptionTiers,
      masterAPIKey: values.masterAPIKey,
    });
  }

  async function onAutoGenerateSubmit(values: z.infer<typeof formSchema>) {
    if (!file) {
      toast.error("Please upload a valid OpenAPI specification file");
      return;
    }
    try {
      const fileText = await file.text();
      const jsonData = JSON.parse(fileText) as OpenAPI.Document;
      const parsedSpec = await SwaggerParser.dereference(jsonData);
      createServiceFromOpenApi({
        fileText: JSON.stringify(parsedSpec),
        serviceName: values.name,
        version: values.version,
        description: values.description,
        tags: values.tags,
        masterAPIKey: values.masterAPIKey,
        baseEndpoint: values.baseEndpoint,
        subscriptionTiers: values.subscriptionTiers,
      });
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to parse OpenAPI specification file. Please ensure it is a valid JSON file.",
      );
    }
  }

  if (!session?.user) {
    return <div>You must be logged in to create a service</div>;
  }

  const sampleAPIGetCode = `// GET /api/key
  router.get('/api/key', (req: Request<{}, {}, {}, GetKeyRequest>, res: Response<GetKeyResponse>) => {
    const { masterAPIKey, subscriptionTier, userEmail } = req.query;
  
    // Your business logic here
    const newAPIKey = 'generated-api-key';
  
    res.json({
      newAPIKey,
      success: true,
    });
  });`;

  const sampleAPIDeleteCode = `// DELETE /api/key
  router.delete(
    '/api/key',
    (
      req: Request<{}, {}, {}, RevokeKeyRequest>,
      res: Response<RevokeKeyResponse>
    ) => {
      const { masterAPIKey, subscriptionTier, userEmail } = req.query;
  
      // Your business logic here to revoke the API key
      // e.g. remove it from your database, mark it invalid, etc.
      const success = true;
  
      res.json({
        success,
      });
    }
  );`;

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <GoBackSideBar />
      <div className="flex h-full grow flex-col overflow-y-auto p-6">
        <div className="mb-6 mr-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create New Service</h1>
          {/* <AutoGenerateDialog /> */}
        </div>

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
                {form.watch("subscriptionTiers")?.map((tier, tierIndex) => (
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
                              <Input placeholder="Enter tier name" {...field} />
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-lg">API Key Info</FormLabel>
              </div>

              <Card key="DEFAULT_INPUT" className="relative">
                <CardContent className="mt-4">
                  {/* ← Bind this to your form */}
                  <FormField
                    control={form.control}
                    name="masterAPIKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Master API Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your master API key"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormDescription className="mb-4 mt-2">
                    This is the master API key that will be used by us to access
                    the following routes.
                  </FormDescription>
                  <FormLabel className="mt-8">
                    These following routes <strong>MUST</strong> be implemented
                    by your service and available to be called.
                  </FormLabel>
                  {/* Table content stays the same */}
                  <div className="mt-8">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request Type</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Input Params</TableHead>
                          <TableHead>Response Params</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          {
                            type: "GET",
                            url: "/api/key",
                            description:
                              "We will use this route to invoke API keys on your behalf",
                            inputParams: [
                              ["masterAPIKey", "string"],
                              ["subscriptionTier", "string"],
                              ["userEmail", "string"],
                            ],
                            outputParams: [
                              ["newAPIKey", "string"],
                              ["success", "boolean"],
                            ],
                          },
                          {
                            type: "DELETE",
                            url: "/api/key",
                            description:
                              "We will use this route to revoke API keys on your behalf.",
                            inputParams: [
                              ["masterAPIKey", "string"],
                              ["oldAPIKey", "string"],
                              ["userEmail", "string"],
                            ],
                            outputParams: [["success", "boolean"]],
                          },
                        ].map((route) => (
                          <TableRow key={`${route.type}-${route.url}`}>
                            <TableCell>
                              <Badge
                                variant={
                                  route.type === "GET"
                                    ? "default"
                                    : "destructive"
                                }
                                className={`flex items-center justify-center ${
                                  route.type === "GET"
                                    ? "w-[80px] bg-green-400 hover:bg-green-500"
                                    : "w-[80px]"
                                }`}
                              >
                                {route.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-gray-500">{route.url}</Badge>
                            </TableCell>
                            <TableCell>
                              <code className="font-mono">
                                {"{"}
                                {route.inputParams.map(([key, type], index) => (
                                  <span key={index} className="block pl-4">
                                    <strong>{key}</strong>: {type}
                                  </span>
                                ))}
                                {"}"}
                              </code>
                            </TableCell>
                            <TableCell>
                              <code className="font-mono">
                                {"{"}
                                {route.outputParams.map(
                                  ([key, type], index) => (
                                    <span key={index} className="block pl-4">
                                      <strong>{key}</strong>: {type}
                                    </span>
                                  ),
                                )}
                                {"}"}
                              </code>
                            </TableCell>
                            <TableCell className="italic">
                              {route.description}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4">
                    <FormLabel className="mb-4">
                      Use the following endpoint to generate a new API key:
                    </FormLabel>
                    <CodeSnippet
                      code={sampleAPIGetCode}
                      language="typescript"
                    />
                  </div>

                  <div className="mt-4">
                    <FormLabel className="mb-4">
                      Use the following endpoint to revoke an existing API key:
                    </FormLabel>
                    <CodeSnippet
                      code={sampleAPIDeleteCode}
                      language="typescript"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <Separator />
            <FormField
              control={form.control}
              name="baseEndpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Endpoint</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The base URL for your API (e.g. https://api.example.com)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-lg">Content Sections</FormLabel>
              </div>

              <Tabs defaultValue="manual">
                <TabsList>
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="auto">Auto-generate</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                  <h1 className="text-sm text-muted-foreground">
                    Create your content manually
                  </h1>
                  <div className="flex items-center justify-between">
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
                                  (endpoint, endpointIndex) => {
                                    // detect your "mandatory" row – e.g. the very first one:

                                    return (
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

                                        {/* only show delete button on non‑mandatory rows */}

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
                                    );
                                  },
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
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/service")}
                      disabled={isCreatingService}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreatingService}
                      onClick={form.handleSubmit(onSubmit)}
                    >
                      {isCreatingService ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Service"
                      )}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent
                  value="auto"
                  className="flex flex-col items-start gap-4"
                >
                  <h1 className="text-sm text-muted-foreground">
                    Create your content through an OpenAPI specification file
                  </h1>
                  <div className="mt-8 flex w-full flex-col items-center space-y-4">
                    <GlowingButton
                      onClick={() =>
                        document.getElementById("file-input")?.click()
                      }
                      type="button"
                      variant="secondary"
                    >
                      Select File
                    </GlowingButton>
                    <Input
                      id="file-input"
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    {file && (
                      <p className="text-sm text-muted-foreground">
                        Selected file: {file.name}
                      </p>
                    )}
                  </div>
                  <div className="flex w-full justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/service")}
                      disabled={isCreatingService}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={isCreatingServiceFromOpenApi}
                      onClick={form.handleSubmit(onAutoGenerateSubmit)}
                    >
                      {isCreatingServiceFromOpenApi ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Generate Service"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
