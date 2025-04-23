import { Card } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { StarRating } from "~/components/ui/stars";

type AnalyticsReviewCardProps = {
  review: {
    id: string;
    content: string;
    starValue: number;
    createdAt: Date;
    service: {
      id: string;
      name: string;
    };
    consumer: {
      user: {
        id: string;
        name: string | null;
        image: string | null;
      };
    };
  };
};

export const AnalyticsReviewCard = ({ review }: AnalyticsReviewCardProps) => {
  // Format the date to show as "X time ago"
  const formattedDate = formatDistanceToNow(review.createdAt, {
    addSuffix: true,
  });

  // Get initials for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return "?";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="w-full p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <Avatar className="h-10 w-10">
            {review.consumer.user.image ? (
              <AvatarImage
                src={review.consumer.user.image || "/placeholder.svg"}
              />
            ) : (
              <AvatarFallback className="text-md">
                {getInitials(review.consumer.user.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-0.5">
            <div className="text-xs font-medium">
              {review.consumer.user.name ?? "Unknown"}
            </div>
            <div className="text-xs text-muted-foreground">{formattedDate}</div>
            <div className="flex origin-left scale-75">
              <StarRating rating={review.starValue} size={16} />
            </div>
          </div>
        </div>
        <a
          href={`/reviews/${review.id}`}
          className="cursor-pointer text-gray-400 hover:text-gray-600"
        >
          <ExternalLink size={18} />
        </a>
      </div>
      <div className="mt-2 line-clamp-2 text-xs">{review.content}</div>
    </Card>
  );
};
