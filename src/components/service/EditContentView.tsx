"use client";

import { Plus, X, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";

import { FormLabel, FormField, FormItem, FormControl, FormMessage } from "~/components/ui/form";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { useToast } from "~/hooks/use-toast";
import EditContentSectionCard from "./EditContentSectionCard";

export default function EditContentView() {
  const { versionId: versionIdParam } = useParams();
  const versionId = versionIdParam as string;
  const { toast } = useToast();
  const utils = api.useUtils();

  const { data: versionData } =
    api.version.getDocumentationByVersionId.useQuery({
      versionId: versionId,
    });

  const { mutate: createEmptyServiceContent } =
    api.version.createEmptyServiceContent.useMutation({
      onSuccess: () => {
        void utils.version.getDocumentationByVersionId.invalidate();
        toast({
          title: "Success",
          description: "Content created",
        });
      },
    });

  const { mutate: createEmptyServiceContentWithTable } =
    api.version.createEmptyServiceContentWithTable.useMutation({
      onSuccess: () => {
        void utils.version.getDocumentationByVersionId.invalidate();
        toast({
          title: "Success",
          description: "Content with table created",
        });
      },
    });

  const { mutate: deleteServiceContent } =
    api.version.deleteServiceContent.useMutation({
      onSuccess: () => {
        void utils.version.getDocumentationByVersionId.invalidate();
        toast({
          title: "Success",
          description: "Content deleted",
        });
      },
    });

  const addTextContent = () => {
    createEmptyServiceContent({
      versionId: versionId,
    });
  };

  const addTableContent = () => {
    createEmptyServiceContentWithTable({
      versionId: versionId,
    });
  };

  const removeContent = (contentId: string) => {
    deleteServiceContent({
      versionId: versionId,
      contentId: contentId,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FormLabel className="text-lg">Content Sections</FormLabel>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTextContent}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Text
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTableContent}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Table
          </Button>
        </div>
      </div>

      {versionData?.contents.map((content, contentIndex) => (
        <Card key={contentIndex} className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => removeContent(content.id)}
          >
            <X className="h-4 w-4" />
          </Button>

          <EditContentSectionCard {...content} />
        </Card>
      ))}
    </div>
  );
}
