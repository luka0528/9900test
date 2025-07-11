import { Badge } from "~/components/ui/badge";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Package, User, ChevronRight, Settings } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    owner: string;
    tags: string[];
    latestVersionId: string;
    latestVersion: string;
    isSubscribed?: boolean;
  };
}

export const ServiceCard = ({ service }: ServiceCardProps) => {
  const router = useRouter();
  const {
    id,
    name,
    owner,
    tags,
    latestVersionId,
    latestVersion,
    isSubscribed,
  } = service;

  const searchParams = useSearchParams();
  const navigateToService = () => {
    // Store current search params
    const currentParams = searchParams.toString();
    // Navigate to service details with search params in state
    router.push(`/service/${id}/${latestVersionId}?${currentParams}`);
  };

  const navigateToServiceSettings = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    // Prevent the card's onClick from firing
    e.stopPropagation();
    router.push(`/service/${id}/purchase`);
  };

  return (
    <Card
      className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:cursor-pointer hover:shadow-lg"
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
      <CardContent className="flex-grow pb-2">
        <div className="mb-4 flex items-center gap-1.5 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{owner}</span>
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
      {isSubscribed ? (
        <CardFooter className="flex border-t bg-muted/40 px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={navigateToServiceSettings}
          >
            <Settings className="h-4 w-4" />
            Manage Subscription
          </Button>

          <Button variant="ghost" size="sm" className="gap-1">
            View details
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      ) : (
        <CardFooter className="flex justify-end border-t bg-muted/40 px-4 py-2">
          <Button variant="ghost" size="sm" className="gap-1">
            View details
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
