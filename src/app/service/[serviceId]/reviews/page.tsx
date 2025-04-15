"use client";

import { Loader2, AlertTriangle, MessageSquarePlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ServiceSidebar } from "~/components/service/ServiceSidebar";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { ReviewCard } from "~/components/service/reviews/ReviewCard";
import { ReviewCardForm } from "~/components/service/reviews/ReviewCardForm";
import { useEffect, useState } from "react";
import { EditReviewModal } from "~/components/service/reviews/EditReviewModal";
import {
  type updateReviewType,
  type ReviewContent,
  type topButtonType,
} from "~/components/service/reviews/helper";
import { toast } from "sonner";
import { Separator } from "~/components/ui/separator";

interface NewCard {
  isVisible: boolean;
  starValue: number | null;
  content: string | null;
}

export default function ReviewsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const serviceId = params.serviceId as string;
  const router = useRouter();

  // Fetch service data from backend
  const {
    data: service,
    isLoading: serviceLoading,
    error: serviceError,
  } = api.service.getServiceMetadataById.useQuery({ serviceId });

  const [reviews, setReviews] = useState<ReviewContent[]>([]);
  const [newCardData, setNewCardData] = useState<NewCard>({
    isVisible: false,
    starValue: null,
    content: null,
  });

  const [editModalOpen, setEditModalOpen] = useState(false);

  // State for editing/deleting reviews
  const [updatedReview, setUpdatedReview] = useState<updateReviewType>({
    ready: false,
    isUpdateDelete: null,
    updatedContent: null,
    updatedRating: null,
    id: null,
  });

  // Editing a review
  const { mutate: editReview } = api.service.editReview.useMutation({
    onSuccess: (data) => {
      setReviews((prevState) =>
        prevState.map((review) =>
          review.id === data.id
            ? {
                ...review,

                // overwrite the content and star value
                content: data.content,
                starValue: data.starValue,
              }
            : review,
        ),
      );
      toast.success("Review edited");
    },
    onError: (error) => {
      toast.error("Failed to edit review", {
        description: error.message,
      });
    },
  });

  // Deleting a review
  const { mutate: deleteReview } = api.service.deleteReview.useMutation({
    onSuccess: (data) => {
      setReviews((prev) => prev.filter((review) => review.id !== data.deleted));
      if (topButton === "EditSubbed") {
        setTopButton("Add");
      } else if (topButton === "EditUnsubbed") {
        setTopButton(null);
      }
      toast.success("Review deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete review", {
        description: error.message,
      });
    },
  });

  // Editing or deleting a review
  useEffect(() => {
    if (
      updatedReview.ready &&
      updatedReview.id !== null &&
      updatedReview.isUpdateDelete !== null
    ) {
      // Delete
      if (updatedReview.isUpdateDelete) {
        deleteReview({
          reviewId: updatedReview.id,
        });
      } else {
        // Edit review
        if (!updatedReview.updatedRating || updatedReview.updatedRating == 0) {
          toast.error("Your rating must be at least 1");
        } else {
          editReview({
            reviewId: updatedReview.id,
            newContent: updatedReview.updatedContent ?? "",
            newRating: updatedReview.updatedRating,
          });
        }
      }
      // Finally reset data
      setUpdatedReview({
        ready: false,
        isUpdateDelete: null,
        updatedContent: null,
        updatedRating: null,
        id: null,
      });
    }
  }, [updatedReview, deleteReview, editReview]);

  // Haven't reviewed = add, reviewed = edit, owner = owned (disabled), not subscribed = null (disabled)
  const [topButton, setTopButton] = useState<topButtonType>(null);

  const { mutate: createReview } = api.service.createReview.useMutation({
    onSuccess: (data) => {
      toast.success("Review posted");
      setReviews([
        {
          id: data.id,
          reviewerId: data.reviewerId,
          reviewerName: data.reviewerName,
          starValue: data.starValue,
          content: data.content,
          postedAt: data.createdAt,
          replies: [],
        },
        ...reviews,
      ]);
    },
    onError: (error) => {
      toast.error("Failed to create review", {
        description: error.message,
      });
    },
  });

  // New review
  useEffect(() => {
    if (newCardData.isVisible && newCardData.starValue !== null) {
      createReview({
        serviceId: serviceId,
        content: newCardData.content ?? "",
        starValue: newCardData.starValue,
      });

      // Finally reset data
      setNewCardData({
        isVisible: false,
        starValue: null,
        content: null,
      });
    }
  }, [newCardData, createReview, serviceId]);

  const [isUserOwner, setIsUserOwner] = useState(false);

  useEffect(() => {
    if (
      session &&
      service?.owners.some((owner) => owner.user.id === session.user.id)
    ) {
      setIsUserOwner(true);
    }
  }, [session, service]);

  // Load review cards
  useEffect(() => {
    if (service) {
      if (service.ratings.length > 0) {
        const reviewContents = service.ratings.map((review) => ({
          id: review.id,
          reviewerId: review.consumer.user.id,
          reviewerName: review.consumer.user.name,
          starValue: review.starValue,
          content: review.content,
          postedAt: review.createdAt,
          replies: review.comments.map((reply) => ({
            id: reply.id,
            replierId: reply.owner.user.id,
            replierName: reply.owner.user.name,
            content: reply.content,
            postedAt: reply.createdAt,
          })),
        }));
        setReviews(reviewContents);
      }
      if (!session) {
        setTopButton(null);
      } else if (
        service.ratings.some(
          (rater) => rater.consumer.user.id === session.user.id,
        )
      ) {
        // Has posted a review
        // TODO for future - make it so that the edit button at the top directly opens the modal
        // for subscribers who have already posted a review
        if (
          service.subscriptionTiers.some((sub) =>
            sub.consumers.some((userId) => userId.userId === session.user.id),
          )
        ) {
          setTopButton("EditSubbed");
        } else {
          setTopButton("EditUnsubbed");
        }
      } else if (
        service.subscriptionTiers.some((sub) =>
          sub.consumers.some((userId) => userId.userId === session.user.id),
        )
      ) {
        // Is subscribed and hasn't posted a review before
        setTopButton("Add");
      } else if (
        service.owners.some((owner) => owner.user.id === session.user.id)
      ) {
        // Owns service
        setTopButton("Owned");
      } else {
        setTopButton(null);
      }
    }
  }, [service, session]);

  // Show loading state
  if (serviceLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (serviceError || !service) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-2xl font-bold text-destructive">
            Service not found
          </h2>
          <p className="mt-2 text-muted-foreground">
            The service you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to view it.
          </p>
          <Button className="mt-4" onClick={() => router.push("/service")}>
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full xl:max-w-[96rem]">
      <ServiceSidebar serviceId={serviceId} />
      <div className="flex h-full grow flex-col overflow-y-auto">
        <div className="p-6">
          {/* Review information (maybe statistics on left) */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">{service.name} reviews</h1>
            <div className="flex items-center gap-2">
              {/* If the current user is subscribed to this service, their should be an add/edit review/rating button */}
              {/*{topButton === "Edit" ? (
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Pencil />
                  Edit review
                </Button>
              ) :*/}{" "}
              {
                <Button
                  className="size-min"
                  variant="outline"
                  disabled={
                    topButton === null ||
                    topButton === "Owned" ||
                    topButton === "EditSubbed" ||
                    topButton === "EditUnsubbed"
                  } // Disable the add review button if not subbed/already posted
                  onClick={() => {
                    setNewCardData({
                      isVisible: true,
                      starValue: null,
                      content: null,
                    });
                  }}
                >
                  <MessageSquarePlus className="animate-slide-in transform transition" />
                  Add review
                </Button>
              }
            </div>
          </div>

          {/* Edit review modal - this won't occur until the edit top button functionality is implemented*/}
          {editModalOpen && (
            <EditReviewModal
              setUpdatedPost={setUpdatedReview}
              originalRating={1} // todo - get rating
              originalContent={"hello"} // todo - get review
              isModalOpen={editModalOpen}
              setModalOpen={setEditModalOpen}
              reviewId={"1"} //todo
              replyId={null}
            />
          )}

          {reviews.length == 0 && (
            <div className="w-full">
              <Separator className="my-6" />
              <div className="flex h-[60vh] items-center justify-center">
                <span className="text-gray-400">
                  No reviews have been posted yet
                </span>
              </div>
            </div>
          )}

          {/* Review cards */}
          <div className="w-full">
            {newCardData.isVisible && session && session.user && (
              <ReviewCardForm
                reviewerName={session.user.name}
                setNewCardData={setNewCardData}
                setTopButton={setTopButton}
              />
            )}
            {reviews.map((review) => (
              <ReviewCard
                isUserOwner={isUserOwner}
                review={review}
                setUpdatedReview={setUpdatedReview}
                key={review.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
