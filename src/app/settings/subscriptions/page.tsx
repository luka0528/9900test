"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "~/trpc/react";

// ShadCN UI imports
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import ManageSubscriptionDialog from "~/components/billing/ManageSubscriptionDialog";
import {
  ServiceConsumer,
  SubscriptionStatus,
  type SubscriptionTier,
} from "@prisma/client";
import ConfirmModal from "~/components/billing/ConfirmDialog";
import { toast } from "sonner";

const SubscriptionsManagementPage: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionTier | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login"); // or wherever you want to redirect
    }
  }, [status, router]);

  const {
    data: subscriptionsData,
    isLoading,
    error,
    refetch,
  } = api.user.getUserSubscriptions.useQuery(undefined, {
    refetchOnMount: "always",
  });

  const deleteSubscriptionMutation =
    api.service.deleteSubscription.useMutation();

  const resumeServiceMutation = api.service.resumeService.useMutation();

  const subscriptionStatusMap = {
    ACTIVE: "Active",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
    PENDING_CANCELLATION: "Pending Cancellation",
    PAYMENT_FAILED: "Payment Failed",
  };

  const serviceAction = (
    subscription: ServiceConsumer & { subscriptionTier: SubscriptionTier },
  ) => {
    if (subscription.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      return (
        <Button
          variant="default"
          size="sm"
          className="w-3/4 max-w-[70px]"
          onClick={() => {
            setSelectedSubscription(subscription.subscriptionTier);
            setShowManageDialog(true);
          }}
        >
          Manage
        </Button>
      );
    } else if (
      subscription.subscriptionStatus === SubscriptionStatus.CANCELLED ||
      subscription.subscriptionStatus === SubscriptionStatus.PAYMENT_FAILED
    ) {
      return (
        <>
          <Button
            variant="default"
            size="sm"
            className="mr-2 w-3/4 max-w-[70px]"
            onClick={() => {
              router.push(
                `/service/${subscription.subscriptionTier.serviceId}/purchase`,
              );
            }}
          >
            {subscription.subscriptionStatus === "PAYMENT_FAILED"
              ? "Retry Payment"
              : "Renew"}
          </Button>
          {subscription.subscriptionStatus === SubscriptionStatus.CANCELLED && (
            <Button
              variant="destructive"
              size="sm"
              className="mt-2 w-3/4 max-w-[70px]"
              onClick={() => {
                deleteSubscriptionMutation.mutate({
                  subscriptionTierId: subscription.id,
                });
              }}
            >
              {"Delete"}
            </Button>
          )}
        </>
      );
    } else if (
      subscription.subscriptionStatus ===
      SubscriptionStatus.PENDING_CANCELLATION
    ) {
      return (
        <Button
          variant="default"
          size="sm"
          className="w-3/4 max-w-[70px]"
          onClick={() => {
            setSelectedSubscription(subscription.subscriptionTier);
            setShowConfirmModal(true);
          }}
        >
          Resume
        </Button>
      );
    }
  };

  const handleServiceResume = async () => {
    if (!selectedSubscription) return;
    try {
      await resumeServiceMutation.mutateAsync({
        subscriptionTierId: selectedSubscription.id,
      });
      refetch();
      toast.success("Subscription resumed successfully.");
    } catch (error) {
      console.error("Error resuming service:", error);
      toast.error("Failed to resume subscription.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading subscriptions...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  if (!subscriptionsData || subscriptionsData.subscriptions.length === 0) {
    return <div className="p-4">You have no subscriptions.</div>;
  }

  return (
    <div className="container mx-auto mt-12 max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Your Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Service</TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">
                  Tier
                </TableHead>
                <TableHead className="w-[80px] whitespace-nowrap">
                  Price
                </TableHead>
                <TableHead className="w-[140px] whitespace-nowrap">
                  Payment Method
                </TableHead>
                <TableHead className="w-[130px]">Next Billing Date</TableHead>
                <TableHead>Auto Renewal</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptionsData.subscriptions.map((subscription) => (
                <TableRow key={subscription.subscriptionTier.id}>
                  <TableCell className="text-[13.5px]">
                    {subscription.subscriptionTier.service.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-[13.5px]">
                    {subscription.subscriptionTier.name}
                  </TableCell>
                  <TableCell className="text-[13.5px]">
                    {subscription.subscriptionTier.price !== 0
                      ? `$${subscription.subscriptionTier.price.toFixed(2)}`
                      : `Free`}
                  </TableCell>
                  <TableCell className="text-[13.5px]">
                    {subscription.paymentMethod
                      ? subscription.paymentMethod.cardBrand
                        ? `**** **** **** ${subscription.paymentMethod.last4}`
                        : subscription.paymentMethod.stripePaymentId
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-[13.5px]">
                    {subscription.renewingSubscription
                      ? new Date(
                          new Date(subscription.lastRenewed).setMonth(
                            new Date(subscription.lastRenewed).getMonth() + 1,
                          ),
                        ).toLocaleDateString(undefined, {
                          year: "2-digit",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-[13.5px]">
                    {subscription.renewingSubscription ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-[13.5px]">
                    {subscriptionStatusMap[subscription.subscriptionStatus] ||
                      "Unknown"}
                  </TableCell>
                  <TableCell className="text-[13.5px]">
                    {serviceAction(subscription)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedSubscription && (
        <ManageSubscriptionDialog
          isOpen={showManageDialog}
          onClose={() => setShowManageDialog(false)}
          subscriptionTier={selectedSubscription}
          refetchSubscriptions={refetch}
        />
      )}

      <ConfirmModal
        open={showConfirmModal}
        title="Resume Subscription"
        description="Are you sure you want to resume this subscription?"
        onConfirm={() => {
          handleServiceResume();
          setShowConfirmModal(false);
        }}
        onCancel={() => {
          setShowConfirmModal(false);
        }}
      />
    </div>
  );
};

export default SubscriptionsManagementPage;
