import { Card, CardFooter } from "~/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { EllipsisVertical, Pencil, Reply, Star, Trash2 } from "lucide-react";
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

interface ReviewCardProps {
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

export const ReviewCard = (/*{ review }: ReviewCardProps*/) => {
  // const { id, reviewerName, starValue, content, postedAt } = review;

  return (
    <Card className="mt-7 grid max-w-full gap-6 border-0 p-6 shadow-none">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src="/placeholder-user.jpg" alt="profile picture" />
          <AvatarFallback>FL</AvatarFallback>
        </Avatar>
        <div className="grid gap-1">
          <div className="font-medium">Firstname Lastname</div>
          <div className="text-xs text-muted-foreground">day month year</div>
        </div>
        <div className="ml-auto flex items-end gap-1">
          <Dropdown />
        </div>
      </div>
      <div className="text-sm leading-loose text-muted-foreground">
        <div className="ml-auto flex items-end">
          <Stars rating={2} />
        </div>
        Insert text here
      </div>
      <div>
        {/* TODO - only render reply button if curr user is the owner */}
        <Button className="size-min" variant="outline">
          <Reply />
          Reply
        </Button>
      </div>
    </Card>
  );
};
