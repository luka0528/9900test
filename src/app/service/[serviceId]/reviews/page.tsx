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

  // Now get the reviews
  // let reviewContents: any = [];
  interface ReviewContents {
    id: string;
    reviewerId: string;
    reviewerName: string | null;
    starValue: number;
    content: string;
    postedAt: Date;
    replies: {
      id: string;
      replierId: string;
      replierName: string | null;
      content: string;
      postedAt: Date;
    }[];
  }

  const [reviews, setReviews] = useState<ReviewContents[]>([]);

  // Load review cards
  useEffect(() => {
    console.log("useEffect triggered");
    if (service && service.ratings.length > 0) {
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
  }, [service]);

  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardData, setNewCardData] = useState(false); // TODO

  // Haven't reviewed - add, reviewed - edit, owner - owned, not subscribed - null (disabled)
  const [topButton, setTopButton] = useState(() => {
    if (!session) {
      return null;
    } else if (
      service.subscriptionTiers.some((sub) =>
        sub.consumers.some((userId) => userId.userId === session.user.id),
      ) &&
      service.ratings.some(
        (rater) => rater.consumer.user.id === session.user.id,
      )
    ) {
      // Is subscribed and posted review before
      return "Edit";
    } else if (
      service.subscriptionTiers.some((sub) =>
        sub.consumers.some((userId) => userId.userId === session.user.id),
      )
    ) {
      // Is subscribed and hasn't posted a review before
      return "Add";
    } else if (
      service.owners.some((owner) => owner.user.id === session.user.id)
    ) {
      // Owns service
      return "Owned";
    }
    return null;
  });
  const [editModalOpen, setEditModalOpen] = useState(false); // todo unused?

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
                    setShowNewCard(true);
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
            {showNewCard && <ReviewCardForm setShowNewCard={setShowNewCard} />}
            {reviews.map((review: any) => (
              <ReviewCard review={review} key={review.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
