import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Package, User, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    owner: string;
    tags: string[];
    latestVersion: string;
  };
}

export const ServiceCard = ({ service }: ServiceCardProps) => {
  const router = useRouter();
  const { id, name, owner, tags, latestVersion } = service;

  const navigateToService = () => {
    router.push(`/service/${id}`);
  };

  return (
    <Card
      className="overflow-hidden transition-all duration-300 hover:cursor-pointer hover:shadow-lg"
      onClick={navigateToService}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">{name}</CardTitle>
          </div>
          <Badge variant="outline">{latestVersion}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mb-4 flex items-center gap-1.5 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Owner: {owner}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags && tags.length > 0 ? (
            tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No tags</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t bg-muted/40 px-4 py-2">
        <Button variant="ghost" size="sm" className="gap-1">
          View details
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
