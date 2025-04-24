// app/service/[serviceId]/test/page.tsx
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
import { Badge } from "~/components/ui/badge";
import { ArrowRightCircle, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ServiceSidebar } from "~/components/service/ServiceSidebar";

// Component imports
import { ParametersTable } from "~/components/api-tester/ParametersTable";
import { HeadersTable } from "~/components/api-tester/HeadersTable";
import { RequestBodySection } from "~/components/api-tester/RequestBodySection";
import { ResponseSection } from "~/components/api-tester/ResponseSection";
import { ApiReferencePanel } from "~/components/api-tester/ApiReferencePanel";
import { ApiReferenceToggle } from "~/components/api-tester/ApiReferenceToggle";
import { EmptyResponseState } from "~/components/api-tester/EmptyResponseState";

// Types
import {
  HTTP_METHODS,
  HttpMethod,
  ApiRoute,
  KeyValue,
  ApiResponse,
} from "~/types/api-tester";

export default function ApiTesterPage() {
  const params = useParams();
  const serviceId = params.serviceId as string;
  const utils = api.useUtils();

  // API query with improved refetch options
  const { data: serviceData, isLoading: isLoadingService } =
    api.service.getServiceById.useQuery(serviceId, {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    });

  // State management
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

  // Update URL when base endpoint changes
  useEffect(() => {
    if (serviceData?.baseEndpoint && path) {
      setUrl(combineUrls(serviceData.baseEndpoint, path));
    }
  }, [serviceData?.baseEndpoint, path]);

  // Load API routes
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

      // Extract routes from versions
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

  // Handle method changes
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

  // Helper functions
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

  const handleSendRequest = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      // Build request URL with query params
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

      // Build headers
      const requestHeaders: Record<string, string> = {};
      headers
        .filter((h) => h.enabled && h.key)
        .forEach((h) => {
          requestHeaders[h.key] = h.value;
        });

      // Prepare request options
      const options: RequestInit = {
        method,
        headers: requestHeaders,
      };

      // Add body for methods that support it
      if (["POST", "PUT", "PATCH"].includes(method) && bodyEnabled && body) {
        try {
          JSON.parse(body);
          options.headers = {
            ...options.headers,
            "Content-Type": "application/json",
          };
          options.body = body;
        } catch (error) {
          options.body = body;
        }
      }

      // Send request and measure time
      const startTime = performance.now();
      const response = await fetch(requestUrl, options);
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Process response
      const responseText = await response.text();
      const responseSize = new Blob([responseText]).size;
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Set the response
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
                        : "Enter path"
                    }
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendRequest}
                    disabled={isLoading || !path.trim()}
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

                {/* Base endpoint info */}
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-sm">
                    Base Endpoint
                  </Badge>
                  <p className="font-mono text-sm">
                    {serviceData?.baseEndpoint || "Loading..."}
                  </p>
                </div>

                {/* Full URL display (optional) */}
                {url && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-sm">
                      Full URL
                    </Badge>
                    <p className="font-mono text-sm text-muted-foreground">
                      {url}
                    </p>
                  </div>
                )}

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
                    <ParametersTable
                      params={queryParams}
                      updateParam={updateParam}
                      removeParam={removeParam}
                    />
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
                    <HeadersTable
                      headers={headers}
                      updateHeader={updateHeader}
                      removeHeader={removeHeader}
                    />
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
                    <RequestBodySection
                      body={body}
                      setBody={setBody}
                      bodyEnabled={bodyEnabled}
                      setBodyEnabled={setBodyEnabled}
                      method={method}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Response Section */}
          {response ? (
            <ResponseSection
              response={response}
              responseTab={responseTab}
              setResponseTab={setResponseTab}
            />
          ) : (
            !isLoading && <EmptyResponseState />
          )}
        </div>
      </div>

      {/* API Reference Toggle */}
      <ApiReferenceToggle
        showReferencePanel={showReferencePanel}
        setShowReferencePanel={setShowReferencePanel}
        hasApiReference={hasApiReference}
      />

      {/* API Reference Panel */}
      <div
        className={`border-l transition-all duration-300 ${
          showReferencePanel ? "w-80 min-w-80" : "w-0 min-w-0 opacity-0"
        } flex-shrink-0 overflow-hidden md:block`}
      >
        {showReferencePanel && (
          <ApiReferencePanel
            showReferencePanel={showReferencePanel}
            selectedVersion={selectedVersion}
            setSelectedVersion={setSelectedVersion}
            versions={versions}
            isLoadingService={isLoadingService}
            serviceRoutes={serviceRoutes}
            handleSelectRoute={handleSelectRoute}
          />
        )}
      </div>
    </div>
  );
}
