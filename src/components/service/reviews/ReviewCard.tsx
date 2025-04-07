import { Card } from "~/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Reply, Star } from "lucide-react";
import { Button } from "../../ui/button";
import { useState } from "react";
import { ReviewReplyCard } from "./ReviewReplyCard";
import { ReviewReplyCardForm } from "./ReviewReplyCardForm";
import OptionsDropdown from "./OptionsDropdown";
import { Separator } from "~/components/ui/separator";
import { ReviewContent } from "~/components/service/reviews/helper";

const Stars = ({ rating }: { rating: number }) => {
  return (
    <>
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="size-24 h-4 w-4 fill-yellow-400 stroke-0" />
      ))}
      {Array.from({ length: 5 - rating }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-muted stroke-muted-foreground stroke-0"
        />
      ))}
    </>
  );
};

interface ReviewCardProps {
  review: ReviewContent;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const {
    id,
    reviewerId,
    reviewerName,
    starValue,
    content,
    postedAt,
    replies,
  } = review;

  const [isReplyOpen, setIsReplyOpen] = useState(false);

  return (
    <>
      <Separator className="my-6" />
      <Card className="mt-7 grid max-w-full gap-6 border-0 p-6 shadow-none">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src="/placeholder-user.jpg" alt="profile picture" />
            <AvatarFallback>{reviewerName && reviewerName[0]}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <div className="font-medium">{reviewerName}</div>
            <div className="text-xs text-muted-foreground">{`${postedAt.toLocaleString()}`}</div>
          </div>
          <div className="ml-auto flex items-end gap-1">
            <OptionsDropdown />
          </div>
        </div>
        <div className="text-sm leading-loose text-muted-foreground">
          <div className="ml-auto flex items-end">
            <Stars rating={starValue} />
          </div>
          {content}
        </div>
        <div>
          {/* TODO - only render reply button if curr user is the owner */}
          <Button
            className="size-min"
            variant="outline"
            onClick={() => setIsReplyOpen(true)}
          >
            <Reply />
            Reply
          </Button>
        </div>
        {isReplyOpen && (
          <ReviewReplyCardForm
            isReplyOpen={isReplyOpen}
            setIsReplyOpen={setIsReplyOpen}
          />
        )}
        {review.replies &&
          review.replies.map((reply) => (
            <ReviewReplyCard
              key={reply.id}
              reply={{
                id: reply.id,
                replierId: reply.replierId,
                replierName: reply.replierName,
                content: reply.content,
                postedAt: reply.postedAt,
              }}
            />
          ))}
      </Card>
    </>
  );
};
