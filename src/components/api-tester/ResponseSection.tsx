// components/api-tester/ResponseSection.tsx
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Clock, FileJson, FileText } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { ApiResponse } from "~/types/api-tester";

interface ResponseSectionProps {
  response: ApiResponse;
  responseTab: string;
  setResponseTab: (tab: string) => void;
}

export function ResponseSection({
  response,
  responseTab,
  setResponseTab,
}: ResponseSectionProps) {
  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-blue-500";
    if (status >= 400 && status < 500) return "bg-yellow-500";
    if (status >= 500) return "bg-red-500";
    return "bg-gray-500";
  };

  const formatJSON = (json: unknown): string => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      console.error("Error formatting JSON:", error);
      return String(json);
    }
  };

  return (
    <Card className="w-full shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Response</CardTitle>
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
                  {Object.entries(response.headers).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {value}
                      </TableCell>
                    </TableRow>
                  ))}
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
  );
}
