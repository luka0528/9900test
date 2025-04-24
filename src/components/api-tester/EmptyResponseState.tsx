// components/api-tester/EmptyResponseState.tsx
import { Card, CardContent } from "~/components/ui/card";
import { Info } from "lucide-react";

export function EmptyResponseState() {
  return (
    <Card className="w-full bg-muted/30 shadow">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Info className="mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-medium">API Tester Ready</h3>
        <p className="max-w-md">
          Enter a URL and click Send to make API requests. You can set query
          parameters, headers, and a request body as needed.
        </p>
      </CardContent>
    </Card>
  );
}
