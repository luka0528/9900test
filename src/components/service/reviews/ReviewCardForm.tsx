import { Card } from "~/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { EllipsisVertical, Pencil, Send, Star, Trash2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { Button } from "../../ui/button";
import StarRating from "./StarRating";
import { Textarea } from "../../ui/textarea";
import { useState } from "react";

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

const Dropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex justify-between">
            <span>Edit</span>
            <Pencil />
          </DropdownMenuItem>
          <DropdownMenuItem className="group flex justify-between hover:text-red-500">
            <span className="group-hover:text-red-500">Delete</span>
            <Trash2 className="group-hover:text-red-500" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// TODO - fix props type
export const ReviewCardForm = (
  { setShowNewCard }: any /*{ review }: ReviewCardProps*/,
) => {
  // const { id, reviewerName, starValue, content, postedAt } = review;
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
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
            onClick={() => setShowNewCard((currState: any) => !currState)}
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
  );
};
