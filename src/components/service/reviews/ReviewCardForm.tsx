import { Card } from "~/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Send, X } from "lucide-react";
import { Button } from "../../ui/button";
import StarRating from "./StarRating";
import { Textarea } from "../../ui/textarea";
import { useState } from "react";
import { Separator } from "~/components/ui/separator";

interface ReviewCardProps {
  setShowNewCard: (rating: number) => void;
  review: {
    id: string;
    reviewerName: string;
    starValue: number;
    content: string;
    postedAt: string;
  };
}

// TODO - fix props type
export const ReviewCardForm = (
  { setShowNewCard }: any /*{ review }: ReviewCardProps*/,
) => {
  // const { id, reviewerName, starValue, content, postedAt } = review;
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <>
      <Separator className="my-6" />
      <Card className="mt-7 grid max-w-full gap-6 border-0 p-6 shadow-none">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border">
            {/* TODO - edit src */}
            <AvatarImage src="/placeholder-user.jpg" alt="profile picture" />
            <AvatarFallback>FL</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <div className="font-medium">Firstname Lastname</div>
            <div className="text-xs text-muted-foreground">day month year</div>
          </div>
          <div className="ml-auto flex items-end gap-1">
            <Button
              className="size-min"
              variant="outline"
              onClick={() => setShowNewCard(false)}
            >
              <X />
            </Button>
          </div>
        </div>
        <div className="text-sm leading-loose text-muted-foreground">
          <div className="ml-auto flex items-end">
            <StarRating
              hoveredRating={hoveredRating}
              setHoveredRating={setHoveredRating}
              selectedRating={selectedRating}
              setSelectedRating={setSelectedRating}
            />
          </div>
          <Textarea placeholder="Insert review (optional)" rows={5} />
        </div>
        <div className="flex justify-end">
          <Button
            className="size-min"
            variant="outline"
            onClick={() => setShowNewCard(false)} // TODO - add, ensure star val >= 1
          >
            <Send />
            Post
          </Button>
        </div>
      </Card>
    </>
  );
};
