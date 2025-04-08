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
import { ReviewContent } from "~/components/service/reviews/helper";
import { toast } from "sonner";
import React from "react";

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

  const { mutate: createReview, isPending: isCreatingReview } =
    api.service.createReview.useMutation({
      onSuccess: (data) => {
        toast.success("Review posted");
        setReviews([
          {
            id: data.id,
            reviewerId: data.reviewerId,
            reviewerName: data.reviewerId,
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
        content: newCardData.content ? newCardData.content : "",
        starValue: newCardData.starValue,
      });

      // Finally reset data
      setNewCardData({
        isVisible: false,
        starValue: null,
        content: null,
      });

      // Update the reviews state
    }
  }, [newCardData]);

  // Haven't reviewed - add, reviewed - edit, owner - owned, not subscribed - null (disabled)
  type buttonType = "Add" | "Edit" | "Owned" | null;
  const [topButton, setTopButton] = useState<buttonType>(null);
  const [editModalOpen, setEditModalOpen] = useState(false); // todo unused?

  // Load review cards
  useEffect(() => {
    console.log("useEffect triggered");
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
        service.subscriptionTiers.some((sub) =>
          sub.consumers.some((userId) => userId.userId === session.user.id),
        ) &&
        service.ratings.some(
          (rater) => rater.consumer.user.id === session.user.id,
        )
      ) {
        // Is subscribed and posted review before
        setTopButton("Edit");
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
  }, [service]);

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
              {topButton === "Edit" ? (
                <EditReviewModal setEditModalOpen={setEditModalOpen} />
              ) : (
                <Button
                  className="size-min"
                  variant="outline"
                  // TODO - also disabled if topButton === "Owned"
                  disabled={topButton === null} // Disable the add review button if not subbed
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
              )}
            </div>
          </div>

          {/* Review cards */}
          <div className="w-full">
            {newCardData.isVisible && session && session.user && (
              <ReviewCardForm
                reviewerName={session.user.name}
                setNewCardData={setNewCardData}
              />
            )}
            {reviews.map((review) => (
              <ReviewCard review={review} key={review.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
