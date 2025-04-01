import { Card } from "~/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";

interface ReviewCardProps {
  review: {
    id: string;
    reviewerName: string;
    starValue: number;
    content: string;
    postedAt: string;
  };
}

export const ReviewCard = (/*{ review }: ReviewCardProps*/) => {
  // const { id, reviewerName, starValue, content, postedAt } = review;

  return (
    <Card className="mb-7 grid w-full max-w-md gap-6 p-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src="/placeholder-user.jpg" alt="profile picture" />
          <AvatarFallback>FL</AvatarFallback>
        </Avatar>
        <div className="grid gap-1">
          <div className="font-medium">Firstname Lastname</div>
          <div className="text-xs text-muted-foreground">x days ago</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <p>Star here</p>
        </div>
      </div>
      <div className="text-sm leading-loose text-muted-foreground">
        INSERT TEXT HERE
      </div>
    </Card>
  );
};
