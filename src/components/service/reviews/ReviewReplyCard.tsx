import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Card } from "../../ui/card";
import { Badge } from "~/components/ui/badge";
import OptionsDropdown from "./OptionsDropdown";

// Assumption - only owners can reply
interface ReplyCardProps {
  reply: {
    id: string;
    replierId: string; // to check if we can edit this reply
    replierName: string | null | undefined;
    content: string;
    postedAt: Date;
  };
}

export const ReviewReplyCard = ({ reply }: ReplyCardProps) => {
  const { id, replierId, replierName, content, postedAt } = reply;

  return (
    <Card className="ml-10 mt-1 grid max-w-full gap-6 border-0 bg-gray-100 p-6 shadow-none">
      <div className="flex w-full items-center gap-4">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src="/placeholder-user.jpg" alt="profile picture" />
          <AvatarFallback>{replierName && replierName[0]}</AvatarFallback>
        </Avatar>
        <div className="grid w-full gap-1">
          <div className="font-medium">
            {replierName}
            <Badge variant="outline" className="ml-2 bg-purple-100">
              Owner
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">{`${postedAt.toLocaleString()}`}</div>
        </div>
        <div className="ml-auto flex items-end gap-1">
          <OptionsDropdown />
        </div>
      </div>
      <div className="text-sm leading-loose text-muted-foreground">
        {content}
      </div>
    </Card>
  );
};
