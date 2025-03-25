import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Download, Package, Calendar, Users } from "lucide-react";
import { Button } from "~/components/ui/button";

interface MarketplaceServiceProps {
  service: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    price: number | null;
    views: number;
    tags: {
      name: string;
    }[];
    versions: {
      description: string;
      version: string;
    }[];
    owners: {
      user: {
        name: string | null;
      };
    }[];
  };
}

export const MarketplaceService = ({ service }: MarketplaceServiceProps) => {
  const { name, createdAt, price, views, versions, tags } = service;
  const { description, version } = versions[0] ?? {
    description: "",
    version: "",
  };
  const creatorName = service.owners[0]?.user?.name;
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:scale-105 hover:cursor-pointer hover:shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary group-hover:text-blue-600" />
            <CardTitle className="text-lg font-bold group-hover:text-blue-600">
              {name}
            </CardTitle>
          </div>
          <Badge variant="outline">{version}</Badge>
        </div>
        <CardDescription className="line-clamp-2 h-10 text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>{views + "K"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{createdAt.toDateString()}</span>
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
            {price && (Number(price) === 0 ? "Free" : "$" + price.toFixed(2))}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
