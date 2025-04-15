import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Card } from "../../ui/card";
import { Badge } from "~/components/ui/badge";
import OptionsDropdown from "./OptionsDropdown";
import type { setUpdateReviewType } from "./helper";
import { useSession } from "next-auth/react";

// Assumption - only owners can reply
interface ReplyCardProps {
  reply: {
    id: string;
    replierId: string | null;
    replierName: string | null | undefined;
    content: string;
    postedAt: Date;
  };
  setUpdatedReply: setUpdateReviewType;
}

export const ReviewReplyCard = ({ reply, setUpdatedReply }: ReplyCardProps) => {
  const { data: session } = useSession();

  const { id, replierId, replierName, content, postedAt } = reply;

  return (
    <Card className="ml-10 mt-1 grid max-w-full gap-6 border-0 bg-gray-100 p-6 shadow-none">
      <div className="flex w-full items-center gap-4">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src="/placeholder-user.jpg" alt="profile picture" />
          <AvatarFallback>{replierName?.[0]}</AvatarFallback>
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
          {/* Only display edit button if logged in user is the one who posted it */}
          {session && session.user.id === replierId && (
            <OptionsDropdown
              originalRating={null}
              originalContent={content}
              reviewId={null}
              replyId={id}
              setUpdatedPost={setUpdatedReply}
            />
          )}
        </div>
      </div>
      <div className="text-sm leading-loose text-muted-foreground">
        {content}
      </div>
    </Card>
  );
};
