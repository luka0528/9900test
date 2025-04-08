import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Download, Package, Calendar, Users } from "lucide-react";
import { Button } from "~/components/ui/button";

interface MarketplaceServiceProps {
  service: {
    id: string;
    name: string;
    tags: {
      name: string;
    }[];
    versions: {
      id: string;
      description: string;
      version: string;
    }[];
    owners: {
      user: {
        name: string | null;
      };
    }[];
  };
  onClick: () => void;
}

export const MarketplaceService = ({
  service,
  onClick,
}: MarketplaceServiceProps) => {
  const { name, tags, versions } = service;
  const latestVersion = versions[0] ?? {
    id: "",
    description: "",
    version: "",
  };
  const creatorName = service.owners[0]?.user?.name;

  return (
    <Card
      onClick={onClick}
      className="overflow-hidden transition-all duration-300 hover:cursor-pointer hover:shadow-lg"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary group-hover:text-blue-600" />
            <CardTitle className="text-lg font-bold group-hover:text-blue-600">
              {name}
            </CardTitle>
          </div>
          <Badge variant="outline">{latestVersion.version}</Badge>
        </div>
        <CardDescription className="line-clamp-2 h-10 text-sm">
          {latestVersion.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>0K</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date().toDateString()}</span>
          </div>
        </div>

        {tags && tags.length > 0 && (
          <div className="mb-2 mt-6 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag.name} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <div>{creatorName}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="min-w-20 border-blue-500 text-sm font-medium hover:bg-blue-50 hover:text-blue-600"
          >
            Free
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
