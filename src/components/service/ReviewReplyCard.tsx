import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Card } from "../ui/card";
import { Badge } from "~/components/ui/badge";

// Assumption - only owners can reply
interface ReplyCardProps {
  reply: {
    id: string;
    replierName: string;
    content: string;
  };
}

export const ReviewReplyCard = (/*{ reply }: ReplyCardProps*/) => {
  // const { id, replierName, replierId, content } = reply;

  return (
    <Card className="ml-10 mt-1 grid max-w-full gap-6 border-0 bg-gray-100 p-6 shadow-none">
      <div className="flex w-full items-center gap-4">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src="/placeholder-user.jpg" alt="profile picture" />
          <AvatarFallback>FL</AvatarFallback>
        </Avatar>
        <div className="grid w-full gap-1">
          <div className="font-medium">Firstname Lastname</div>
          <div className="text-xs text-muted-foreground">day month year</div>
        </div>
        <div className="ml-auto flex items-end gap-1">
          <Badge variant="secondary" className="bg-purple-100">
            Owner
          </Badge>
        </div>
      </div>
      <div className="text-sm leading-loose text-muted-foreground">
        INSERT TEXT HERE
      </div>
    </Card>
  );
};
