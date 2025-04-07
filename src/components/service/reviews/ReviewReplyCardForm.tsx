import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Card } from "../../ui/card";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Send, X } from "lucide-react";
import { Button } from "~/components/ui/button";

// Assumption - only owners can reply
interface ReplyCardProps {
  reply: {
    id: string;
    replierId: string; // to check if we can edit this reply
    replierName: string;
    content: string;
    postedAt: string;
  };
}

interface props {
  isReplyOpen: boolean;
  setIsReplyOpen: (isOpen: boolean) => void;
}

export const ReviewReplyCardForm = (
  { isReplyOpen, setIsReplyOpen }: props /*{ reply }: ReplyCardProps*/,
) => {
  // const { id, replierId, replierName, content } = reply;

  return (
    <Card className="ml-10 mt-1 grid max-w-full gap-6 border-0 bg-gray-100 p-6 shadow-none">
      <div className="flex w-full items-center gap-4">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src="/placeholder-user.jpg" alt="profile picture" />
          <AvatarFallback>FL</AvatarFallback>
        </Avatar>
        <div className="grid w-full gap-1">
          <div className="font-medium">
            insert name
            <Badge variant="outline" className="ml-2 bg-purple-100">
              Owner
            </Badge>
          </div>
        </div>
        <div className="ml-auto flex items-end gap-1">
          <Button
            className="size-min"
            variant="outline"
            onClick={() => setIsReplyOpen(false)}
          >
            <X />
          </Button>
        </div>
      </div>
      <div className="text-sm leading-loose text-muted-foreground">
        <Textarea placeholder="Insert response" rows={5} />
      </div>
      <div className="flex justify-end">
        <Button
          className="size-min"
          variant="outline"
          onClick={() => setIsReplyOpen(false)} // TODO - add, ensure text len >= 1
        >
          <Send />
          Post
        </Button>
      </div>
    </Card>
  );
};
