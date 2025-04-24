// components/api-tester/ApiReferencePanel.tsx
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { AlertTriangle, BookOpen, Loader2 } from "lucide-react";
import { ApiRoute } from "~/types/api-tester";

interface ApiReferencePanelProps {
  showReferencePanel: boolean;
  selectedVersion: string;
  setSelectedVersion: (version: string) => void;
  versions: { id: string; version: string }[];
  isLoadingService: boolean;
  serviceRoutes: ApiRoute[];
  handleSelectRoute: (route: ApiRoute) => void;
}

export function ApiReferencePanel({
  showReferencePanel,
  selectedVersion,
  setSelectedVersion,
  versions,
  isLoadingService,
  serviceRoutes,
  handleSelectRoute,
}: ApiReferencePanelProps) {
  if (!showReferencePanel) return null;

  const getMethodColor = (method: string): string => {
    switch (method) {
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
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 space-y-3">
        <h3 className="flex items-center text-lg font-medium">
          <BookOpen className="mr-2 h-4 w-4" />
          API Reference
        </h3>

        {versions.length > 0 && (
          <Select value={selectedVersion} onValueChange={setSelectedVersion}>
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
                    <Badge className={getMethodColor(route.method)}>
                      {route.method}
                    </Badge>
                    <div>
                      <p className="break-all font-mono text-sm">
                        {route.route}
                      </p>
                      {route.description && (
                        <p className="text-xs text-muted-foreground">
                          {route.description}
                        </p>
                      )}
                    </div>
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
  );
}
