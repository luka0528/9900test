// components/api-tester/ApiReferenceToggle.tsx
import { Button } from "~/components/ui/button";
import { BookOpen, ChevronRight } from "lucide-react";

interface ApiReferenceToggleProps {
  showReferencePanel: boolean;
  setShowReferencePanel: (show: boolean) => void;
  hasApiReference: boolean;
}

export function ApiReferenceToggle({
  showReferencePanel,
  setShowReferencePanel,
  hasApiReference,
}: ApiReferenceToggleProps) {
  return (
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
  );
}
