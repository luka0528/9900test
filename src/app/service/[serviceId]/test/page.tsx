"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import {
  ArrowRightCircle,
  BookOpen,
  ChevronRight,
  Clock,
  FileJson,
  FileText,
  Info,
  Loader2,
  Plus,
  Trash,
  AlertTriangle,
} from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ServiceSidebar } from "~/components/service/ServiceSidebar";

// HTTP method types
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

// Response interface
interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
  size: number;
}

interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
  id: string;
}

interface ApiRoute {
  method: HttpMethod;
  route: string;
  description?: string;
  version: string;
}

export default function ApiTesterPage() {
  const params = useParams();
  const serviceId = params.serviceId as string;

  const { data: serviceData, isLoading: isLoadingService } =
    api.service.getServiceById.useQuery(serviceId);

  const [path, setPath] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [headers, setHeaders] = useState<KeyValue[]>([
    { key: "", value: "", enabled: true, id: crypto.randomUUID() },
  ]);
  const [queryParams, setQueryParams] = useState<KeyValue[]>([
    { key: "", value: "", enabled: true, id: crypto.randomUUID() },
  ]);
  const [body, setBody] = useState<string>("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("params");
  const [responseTab, setResponseTab] = useState<string>("body");
  const [showReferencePanel, setShowReferencePanel] = useState<boolean>(false);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [versions, setVersions] = useState<{ id: string; version: string }[]>(
    [],
  );
  const [bodyEnabled, setBodyEnabled] = useState<boolean>(true);
  const [serviceRoutes, setServiceRoutes] = useState<ApiRoute[]>([]);

  useEffect(() => {
    if (serviceData?.versions && serviceData.versions.length > 0) {
      const routes: ApiRoute[] = [];

      const uniqueVersions = serviceData.versions.map((version) => ({
        id: version.id,
        version: version.version,
      }));

      setVersions(uniqueVersions);

      if (uniqueVersions.length > 0 && !selectedVersion) {
        setSelectedVersion(uniqueVersions[0]!.version);
      }

      serviceData.versions.forEach((version) => {
        version.contents?.forEach((content) => {
          content.endpoints?.forEach((endpoint) => {
            routes.push({
              method: "GET",
              route: endpoint.path,
              description: endpoint.description,
              version: version.version,
            });
          });
        });
      });

      setServiceRoutes(routes);

      if (routes.length > 0) {
        setShowReferencePanel(true);
      }
    }
  }, [serviceData, selectedVersion]);

  useEffect(() => {
    if (method === "GET") {
      setBody("");
      setBodyEnabled(false);

      if (activeTab === "body") {
        setActiveTab("params");
      }
    } else if (!bodyEnabled && ["POST", "PUT", "PATCH"].includes(method)) {
      setBodyEnabled(true);
    }
  }, [method, bodyEnabled, activeTab]);

  const addHeader = () => {
    setHeaders([
      ...headers,
      { key: "", value: "", enabled: true, id: crypto.randomUUID() },
    ]);
  };

  const addParam = () => {
    setQueryParams([
      ...queryParams,
      { key: "", value: "", enabled: true, id: crypto.randomUUID() },
    ]);
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };

  const removeParam = (id: string) => {
    setQueryParams(queryParams.filter((p) => p.id !== id));
  };

  const updateHeader = (
    id: string,
    key: string,
    value: string,
    enabled: boolean,
  ) => {
    setHeaders(
      headers.map((h) => (h.id === id ? { ...h, key, value, enabled } : h)),
    );
  };

  const updateParam = (
    id: string,
    key: string,
    value: string,
    enabled: boolean,
  ) => {
    setQueryParams(
      queryParams.map((p) => (p.id === id ? { ...p, key, value, enabled } : p)),
    );
  };

  const formatJSON = (json: unknown): string => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      console.error("Error formatting JSON:", error);
      return String(json);
    }
  };

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-blue-500";
    if (status >= 400 && status < 500) return "bg-yellow-500";
    if (status >= 500) return "bg-red-500";
    return "bg-gray-500";
  };

  const handleSendRequest = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      let requestUrl = url;
      const enabledParams = queryParams.filter((p) => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const queryString = enabledParams
          .map(
            (p) =>
              `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`,
          )
          .join("&");
        requestUrl = `${requestUrl}${requestUrl.includes("?") ? "&" : "?"}${queryString}`;
      }

      const requestHeaders: Record<string, string> = {};
      headers
        .filter((h) => h.enabled && h.key)
        .forEach((h) => {
          requestHeaders[h.key] = h.value;
        });

      const options: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (["POST", "PUT", "PATCH"].includes(method) && bodyEnabled && body) {
        try {
          JSON.parse(body);
          options.headers = {
            ...options.headers,
            "Content-Type": "application/json",
          };
          options.body = body;
        } catch (error) {
          console.warn("Invalid JSON body, sending as text:", error);
          options.body = body;
        }
      }

      const startTime = performance.now();
      const response = await fetch(requestUrl, options);
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      let responseData: unknown;
      const responseText = await response.text();
      const responseSize = new Blob([responseText]).size;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        time: Math.round(responseTime),
        size: responseSize,
      });
    } catch (error) {
      toast.error("Request failed", {
        description:
          (error as Error)?.message ||
          "An error occurred while making the request",
      });

      setResponse({
        status: 0,
        statusText: "Error",
        headers: {},
        data: { error: (error as Error)?.message || "Request failed" },
        time: 0,
        size: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const combineUrls = (base: string, path: string): string => {
    if (!base) return path;
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };

  const handleSelectRoute = (route: ApiRoute) => {
    setPath(route.route);
    setUrl(combineUrls(serviceData!.baseEndpoint, route.route));
    setMethod(route.method);
    setQueryParams([
      { key: "", value: "", enabled: true, id: crypto.randomUUID() },
    ]);
    setHeaders([
      { key: "", value: "", enabled: true, id: crypto.randomUUID() },
    ]);
    setBody("");
    setBodyEnabled(!["GET"].includes(route.method));
    if (route.method === "GET") {
      setActiveTab("params");
    } else {
      setActiveTab("body");
    }
  };

  const hasApiReference = serviceRoutes.length > 0;

  return (
    <div className="flex h-full w-full">
      {/* Left sidebar */}
      <ServiceSidebar serviceId={serviceId} />

      {/* Main content area */}
      <div className="flex-grow overflow-y-auto p-4">
        <div className="flex flex-col space-y-6">
          {/* API Tester Card */}
          <Card className="w-full shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  {serviceData?.name} API Tester
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                {/* URL and Method Row */}
                <div className="flex gap-2">
                  <div className="w-[140px]">
                    <Select
                      value={method}
                      onValueChange={(value) => setMethod(value as HttpMethod)}
                    >
                      <SelectTrigger
                        className={`h-10 font-medium ${(() => {
                          switch (method) {
                            case "GET":
                              return "bg-blue-500 text-white";
                            case "POST":
                              return "bg-green-500 text-white";
                            case "PUT":
                              return "bg-orange-500 text-white";
                            case "DELETE":
                              return "bg-red-500 text-white";
                            case "PATCH":
                              return "bg-purple-500 text-white";
                            default:
                              return "bg-gray-500 text-white";
                          }
                        })()}`}
                      >
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        {HTTP_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    value={path}
                    onChange={(e) => {
                      setPath(e.target.value);
                      setUrl(
                        combineUrls(
                          serviceData?.baseEndpoint || "",
                          e.target.value,
                        ),
                      );
                    }}
                    placeholder={
                      hasApiReference
                        ? "Select an endpoint from API Reference →"
                        : "Enter URL"
                    }
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendRequest}
                    disabled={isLoading || !url.trim()}
                    className="w-24"
                  >
                    Test
                    {isLoading ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRightCircle className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-sm">
                    Base Endpoint
                  </Badge>
                  <p className="font-mono text-sm">
                    {serviceData?.baseEndpoint || "Loading..."}
                  </p>
                </div>

                {/* Request Config Tabs */}
                <Tabs
                  defaultValue="params"
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <TabsList>
                    <TabsTrigger value="params">Query Parameters</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="body" disabled={method === "GET"}>
                      Body {method === "GET" && "(N/A)"}
                    </TabsTrigger>
                  </TabsList>

                  {/* Query Parameters Tab */}
                  <TabsContent value="params" className="pt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead style={{ width: "4rem" }}></TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead style={{ width: "4rem" }}></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {queryParams.map((param) => (
                            <TableRow key={param.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={param.enabled}
                                  onChange={(e) =>
                                    updateParam(
                                      param.id,
                                      param.key,
                                      param.value,
                                      e.target.checked,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={param.key}
                                  onChange={(e) =>
                                    updateParam(
                                      param.id,
                                      e.target.value,
                                      param.value,
                                      param.enabled,
                                    )
                                  }
                                  placeholder="Key"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={param.value}
                                  onChange={(e) =>
                                    updateParam(
                                      param.id,
                                      param.key,
                                      e.target.value,
                                      param.enabled,
                                    )
                                  }
                                  placeholder="Value"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeParam(param.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addParam}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Parameter
                    </Button>
                  </TabsContent>

                  {/* Headers Tab */}
                  <TabsContent value="headers" className="pt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead style={{ width: "4rem" }}></TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead style={{ width: "4rem" }}></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {headers.map((header) => (
                            <TableRow key={header.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={header.enabled}
                                  onChange={(e) =>
                                    updateHeader(
                                      header.id,
                                      header.key,
                                      header.value,
                                      e.target.checked,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={header.key}
                                  onChange={(e) =>
                                    updateHeader(
                                      header.id,
                                      e.target.value,
                                      header.value,
                                      header.enabled,
                                    )
                                  }
                                  placeholder="Key"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={header.value}
                                  onChange={(e) =>
                                    updateHeader(
                                      header.id,
                                      header.key,
                                      e.target.value,
                                      header.enabled,
                                    )
                                  }
                                  placeholder="Value"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeHeader(header.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addHeader}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Header
                    </Button>
                  </TabsContent>

                  {/* Body Tab */}
                  <TabsContent value="body" className="pt-4">
                    <div className="mb-2 rounded-md border">
                      <div className="flex items-center bg-muted/50 p-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="body-enabled"
                            checked={bodyEnabled}
                            onChange={(e) => setBodyEnabled(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor="body-enabled" className="font-medium">
                            Request Body
                          </label>
                        </div>
                        {bodyEnabled && (
                          <div className="ml-auto">
                            <Badge variant="outline" className="text-xs">
                              Content-Type: application/json
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Textarea
                        placeholder={`{
  "name": "value",
  "example": true
}`}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="h-60 resize-none rounded-none border-0 font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
                        disabled={!bodyEnabled}
                      />
                    </div>

                    {/* Additional help text */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {bodyEnabled
                          ? "Enter JSON data for your request body."
                          : "Enable the checkbox to add a request body."}
                      </span>
                      {bodyEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            try {
                              const formatted = JSON.stringify(
                                JSON.parse(body),
                                null,
                                2,
                              );
                              setBody(formatted);
                              toast.success("JSON formatted");
                            } catch (error) {
                              console.error("Invalid JSON:", error);
                              toast.error("Invalid JSON");
                            }
                          }}
                          className="h-6 text-xs"
                        >
                          Format JSON
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Response Section */}
          {response && (
            <Card className="w-full shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">
                    Response
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(response.status)}>
                      {response.status} {response.statusText}
                    </Badge>
                    <Badge variant="outline" className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" /> {response.time}ms
                    </Badge>
                    <Badge variant="outline">
                      {response.size > 1024
                        ? `${(response.size / 1024).toFixed(1)}KB`
                        : `${response.size}B`}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue="body"
                  value={responseTab}
                  onValueChange={setResponseTab}
                >
                  <TabsList>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="body" className="pt-4">
                    <div className="relative">
                      <div className="absolute right-2 top-2 flex gap-2">
                        <Badge variant="outline" className="flex items-center">
                          {typeof response.data === "object" ? (
                            <FileJson className="mr-1 h-3 w-3" />
                          ) : (
                            <FileText className="mr-1 h-3 w-3" />
                          )}
                          {typeof response.data === "object" ? "JSON" : "Text"}
                        </Badge>
                      </div>
                      <ScrollArea className="h-[400px] rounded-md border bg-muted/50 p-4">
                        <pre className="font-mono text-sm">
                          {formatJSON(response.data)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  <TabsContent value="headers" className="pt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Header</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(response.headers).map(
                            ([key, value]) => (
                              <TableRow key={key}>
                                <TableCell className="font-medium">
                                  {key}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {value}
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                          {Object.keys(response.headers).length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={2}
                                className="py-4 text-center text-muted-foreground"
                              >
                                No headers returned
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {!response && !isLoading && (
            <Card className="w-full bg-muted/30 shadow">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Info className="mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-medium">API Tester Ready</h3>
                <p className="max-w-md">
                  Enter a URL and click Send to make API requests. You can set
                  query parameters, headers, and a request body as needed.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Toggle button for API reference */}
      <div className="fixed bottom-6 right-6 z-50 md:block">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReferencePanel(!showReferencePanel)}
          className="rounded-full shadow-md"
        >
          {showReferencePanel ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <div className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              {hasApiReference ? "API Reference" : "No API Reference"}
            </div>
          )}
        </Button>
      </div>

      {/* Right sidebar for API reference - conditionally rendered */}
      <div
        className={`border-l transition-all duration-300 ${
          showReferencePanel ? "w-80 min-w-80" : "w-0 min-w-0 opacity-0"
        } flex-shrink-0 overflow-hidden md:block`}
      >
        {showReferencePanel && (
          <div className="h-full overflow-y-auto p-4">
            <div className="mb-4 space-y-3">
              <h3 className="flex items-center text-lg font-medium">
                <BookOpen className="mr-2 h-4 w-4" />
                API Reference
              </h3>

              {versions.length > 0 && (
                <Select
                  value={selectedVersion}
                  onValueChange={setSelectedVersion}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((ver) => (
                      <SelectItem key={ver.id} value={ver.version}>
                        Version {ver.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {isLoadingService ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : serviceRoutes.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-4">
                  {serviceRoutes
                    .filter(
                      (route) =>
                        !selectedVersion || route.version === selectedVersion,
                    )
                    .map((route, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer p-2 hover:bg-muted/50"
                        onClick={() => handleSelectRoute(route)}
                      >
                        <div className="justify-flex-start flex items-center space-x-2">
                          <Badge
                            className={(() => {
                              switch (route.method) {
                                case "GET":
                                  return "bg-blue-500";
                                case "POST":
                                  return "bg-green-500";
                                case "PUT":
                                  return "bg-orange-500";
                                case "DELETE":
                                  return "bg-red-500";
                                case "PATCH":
                                  return "bg-purple-500";
                                default:
                                  return "bg-gray-500";
                              }
                            })()}
                          >
                            {route.method}
                          </Badge>
                          <p className="break-all font-mono text-sm">
                            {route.route}
                          </p>
                        </div>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No API routes found</AlertTitle>
                <AlertDescription>
                  {selectedVersion
                    ? `No API routes found for version ${selectedVersion}`
                    : "This service doesn't have any documented API routes."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
