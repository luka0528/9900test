import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Card } from "../../ui/card";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Send, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRef } from "react";
import { toast } from "sonner";

interface props {
  replierName: string | null | undefined;
  setReplyData: (prev: { isVisible: boolean; content: string | null }) => void;
}

export const ReviewReplyCardForm = ({ replierName, setReplyData }: props) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleReply = () => {
    if (!textAreaRef.current || textAreaRef.current.value.length == 0) {
      toast.error("Your reply cannot be empty");
    } else {
      setReplyData({
        isVisible: true,
        content: textAreaRef.current ? textAreaRef.current.value : null,
      });
    }
  };

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
        </div>
        <div className="ml-auto flex items-end gap-1">
          <Button
            className="size-min"
            variant="outline"
            onClick={() =>
              setReplyData({
                isVisible: false,
                content: null,
              })
            }
          >
            <X />
          </Button>
        </div>
      </div>
      <div className="text-sm leading-loose text-muted-foreground">
        <Textarea ref={textAreaRef} placeholder="Insert response" rows={5} />
      </div>
      <div className="flex justify-end">
        <Button
          className="size-min"
          variant="outline"
          onClick={() => handleReply()}
        >
          <Send />
          Post
        </Button>
      </div>
    </Card>
  );
};
