import { Card } from "~/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Send, X } from "lucide-react";
import { Button } from "../../ui/button";
import StarRating from "./StarRating";
import { Textarea } from "../../ui/textarea";
import { useRef, useState } from "react";
import { Separator } from "~/components/ui/separator";
import { error } from "console";
import { toast } from "sonner";

interface ReviewCardFormProps {
  reviewerName: string | null | undefined;
  setNewCardData: (prev: {
    isVisible: boolean;
    starValue: number | null;
    content: string | null;
  }) => void;
}

// TODO - fix props type
export const ReviewCardForm = ({
  reviewerName,
  setNewCardData,
}: ReviewCardFormProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handlePost = () => {
    if (selectedRating == 0) {
      toast.error("You must give a rating");
    } else {
      setNewCardData({
        isVisible: true,
        starValue: selectedRating,
        content: textAreaRef.current ? textAreaRef.current.value : null,
      });
    }
  };

  return (
    <>
      <Separator className="my-6" />
      <Card className="mt-7 grid max-w-full gap-6 border-0 p-6 shadow-none">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border">
            {/* TODO - edit src */}
            <AvatarImage src="/placeholder-user.jpg" alt="profile picture" />
            <AvatarFallback>{reviewerName && reviewerName[0]}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <div className="font-medium">{reviewerName}</div>
          </div>
          <div className="ml-auto flex items-end gap-1">
            <Button
              className="size-min"
              variant="outline"
              onClick={() =>
                setNewCardData({
                  isVisible: false,
                  starValue: null,
                  content: null,
                })
              }
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
          <Textarea
            placeholder="Insert review (optional)"
            ref={textAreaRef}
            rows={5}
          />
        </div>
        <div className="flex justify-end">
          <Button
            className="size-min"
            variant="outline"
            onClick={() => handlePost()}
          >
            <Send />
            Post
          </Button>
        </div>
      </Card>
    </>
  );
};
