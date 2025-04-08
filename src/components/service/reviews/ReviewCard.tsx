import { Card } from "~/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Reply, Star } from "lucide-react";
import { Button } from "../../ui/button";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ReviewReplyCard } from "./ReviewReplyCard";
import { ReviewReplyCardForm } from "./ReviewReplyCardForm";
import OptionsDropdown from "./OptionsDropdown";
import { Separator } from "~/components/ui/separator";
import type {
  ReviewContent,
  updateReviewType,
  setUpdateReviewType,
} from "~/components/service/reviews/helper";
import { toast } from "sonner";
import { api } from "~/trpc/react";

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

interface ReviewCardProps {
  review: ReviewContent;
  isUserOwner: boolean;
  setUpdatedReview: setUpdateReviewType;
}

interface ReplyCard {
  isVisible: boolean;
  content: string | null;
}

export const ReviewCard = ({
  review,
  isUserOwner,
  setUpdatedReview,
}: ReviewCardProps) => {
  const { data: session } = useSession();
  const serviceId = useParams().serviceId as string;

  const {
    id,
    reviewerId,
    reviewerName,
    starValue,
    content,
    postedAt,
    replies,
  } = review;

  const [replyData, setReplyData] = useState<ReplyCard>({
    isVisible: false,
    content: null,
  });

  const [updatedReply, setUpdatedReply] = useState<updateReviewType>({
    ready: false,
    isUpdateDelete: null,
    updatedRating: null,
    updatedContent: null,
    id: null,
  });

  // Editing a reply
  const { mutate: editReply, isPending: isEditingReply } =
    api.service.editReviewReply.useMutation({
      onSuccess: (data) => {
        setAllReplies((prevState) =>
          prevState.map((reply) =>
            reply.id === data.id
              ? {
                  ...reply,
                  content: data.content, // overwrite the content with the updated content
                }
              : reply,
          ),
        );
        toast.success("Reply edited");
      },
      onError: (error) => {
        toast.error("Failed to edit reply", {
          description: error.message,
        });
      },
    });

  // Deleting a reply
  const { mutate: deleteReply, isPending: isDeletingReply } =
    api.service.deleteReviewReply.useMutation({
      onSuccess: (data) => {
        setAllReplies((prev) =>
          prev.filter((reply) => reply.id !== data.deleted),
        );
        toast.success("Reply deleted");
      },
      onError: (error) => {
        toast.error("Failed to delete reply", {
          description: error.message,
        });
      },
    });

  useEffect(() => {
    if (
      updatedReply.ready &&
      updatedReply.id !== null &&
      updatedReply.isUpdateDelete !== null
    ) {
      // Delete
      if (updatedReply.isUpdateDelete) {
        deleteReply({
          commentId: updatedReply.id,
        });
      } else if (updatedReply.updatedContent !== null) {
        if (updatedReply.updatedContent.length == 0) {
          toast.error("Your reply cannot be empty");
        } else {
          // Edit reply
          editReply({
            commentId: updatedReply.id,
            newContent: updatedReply.updatedContent || "",
          });
        }
      }
      // Finally reset data
      setUpdatedReply({
        ready: false,
        isUpdateDelete: null,
        updatedContent: null,
        updatedRating: null,
        id: null,
      });
    }
  }, [updatedReply.id]);

  const [allReplies, setAllReplies] = useState(replies);

  const { mutate: createReply, isPending: isCreatingReply } =
    api.service.createReviewReply.useMutation({
      onSuccess: (data) => {
        toast.success("Reply posted");
        setAllReplies([
          {
            id: data.id,
            replierId: data.replierId,
            replierName: data.replierName,
            content: data.content,
            postedAt: data.createdAt,
          },
          ...allReplies,
        ]);
      },
      onError: (error) => {
        toast.error("Failed to create reply", {
          description: error.message,
        });
      },
    });

  useEffect(() => {
    if (replyData.isVisible && replyData.content !== null) {
      // Create reply
      createReply({
        serviceId: serviceId,
        reviewId: id,
        content: replyData.content,
      });

      // Finally reset data
      setReplyData({
        isVisible: false,
        content: null,
      });
    }
  }, [replyData.content]);

  return (
    <>
      <Separator className="my-6" />
      <Card className="mt-7 grid max-w-full gap-6 border-0 p-6 shadow-none">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src="/placeholder-user.jpg" alt="profile picture" />
            <AvatarFallback>{reviewerName && reviewerName[0]}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <div className="font-medium">{reviewerName}</div>
            <div className="text-xs text-muted-foreground">{`${postedAt.toLocaleString()}`}</div>
          </div>
          <div className="ml-auto flex items-end gap-1">
            {/* Only display edit button if logged in user is the one who posted it */}
            {session && session.user.id === reviewerId && (
              <OptionsDropdown
                setUpdatedPost={setUpdatedReview}
                originalRating={starValue}
                originalContent={content}
                reviewId={id}
                replyId={null}
              />
            )}
          </div>
        </div>
        <div className="text-sm leading-loose text-muted-foreground">
          <div className="ml-auto flex items-end">
            <Stars rating={starValue} />
          </div>
          {content}
        </div>
        <div>
          {/* Only render reply button if curr user is the owner */}
          {isUserOwner && (
            <Button
              className="size-min"
              variant="outline"
              onClick={() =>
                setReplyData({
                  isVisible: true,
                  content: null,
                })
              }
            >
              <Reply />
              Reply
            </Button>
          )}
        </div>
        {replyData.isVisible && session && (
          <ReviewReplyCardForm
            replierName={session.user.name}
            setReplyData={setReplyData}
          />
        )}
        {allReplies &&
          allReplies.map((reply) => (
            <ReviewReplyCard
              key={reply.id}
              reply={{
                id: reply.id,
                replierId: reply.replierId,
                replierName: reply.replierName,
                content: reply.content,
                postedAt: reply.postedAt,
              }}
              setUpdatedReply={setUpdatedReply}
            />
          ))}
      </Card>
    </>
  );
};
