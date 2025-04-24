// components/api-tester/RequestBodySection.tsx
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

interface RequestBodySectionProps {
  body: string;
  setBody: (body: string) => void;
  bodyEnabled: boolean;
  setBodyEnabled: (enabled: boolean) => void;
  method: string;
}

export function RequestBodySection({
  body,
  setBody,
  bodyEnabled,
  setBodyEnabled,
  method,
}: RequestBodySectionProps) {
  return (
    <>
      <div className="mb-2 rounded-md border">
        <div className="flex items-center bg-muted/50 p-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="body-enabled"
              checked={bodyEnabled}
              onChange={(e) => setBodyEnabled(e.target.checked)}
              disabled={method === "GET"}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label
              htmlFor="body-enabled"
              className={`font-medium ${method === "GET" ? "text-muted-foreground" : ""}`}
            >
              Request Body
            </label>
          </div>
          {method === "GET" && (
            <div className="ml-2 flex items-center text-xs text-muted-foreground">
              GET requests don`&apos`t include a request body
            </div>
          )}
          {bodyEnabled && !method.includes("GET") && (
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
          disabled={!bodyEnabled || method === "GET"}
        />
      </div>

      {/* Additional help text */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {method === "GET"
            ? "Use query parameters instead of body for GET requests."
            : bodyEnabled
              ? "Enter JSON data for your request body."
              : "Enable the checkbox to add a request body."}
        </span>
        {bodyEnabled && !method.includes("GET") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              try {
                const formatted = JSON.stringify(JSON.parse(body), null, 2);
                setBody(formatted);
                toast.success("JSON formatted");
              } catch (error) {
                console.error("Invalid JSON", error);
                toast.error("Invalid JSON");
              }
            }}
            className="h-6 text-xs"
          >
            Format JSON
          </Button>
        )}
      </div>
    </>
  );
}
