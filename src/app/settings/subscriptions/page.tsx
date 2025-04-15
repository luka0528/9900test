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
import type { SubscriptionTier } from "@prisma/client";
import { toast } from "sonner";

const SubscriptionsManagementPage: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionTier | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);

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
  } = api.user.getUserSubscriptions.useQuery();

  const deleteSubscriptionMutation =
    api.service.deleteSubscription.useMutation();

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

  const subscriptionStatusMap = {
    ACTIVE: "Active",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
    PENDING_CANCELLATION: "Pending Cancellation",
    PAYMENT_FAILED: "Payment Failed",
  };

  return (
    <div className="container mx-auto mt-12 max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Your Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Next Billing Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                    {subscription.lastRenewed
                      ? new Date(
                          new Date(subscription.lastRenewed).setMonth(
                            new Date(subscription.lastRenewed).getMonth() + 1,
                          ),
                        ).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-[13.5px]">
                    {subscriptionStatusMap[subscription.subscriptionStatus] ||
                      "Unknown"}
                  </TableCell>
                  <TableCell className="text-[13.5px]">
                    {/* manage subscription, restart subscription,  */}
                    {subscription.subscriptionStatus === "ACTIVE" ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedSubscription(
                            subscription.subscriptionTier,
                          );
                          setShowManageDialog(true);
                        }}
                      >
                        Manage
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="default"
                          size="sm"
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

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            deleteSubscriptionMutation.mutate({
                              subscriptionTierId: subscription.id,
                            });
                          }}
                        >
                          {"Delete"}
                        </Button>
                      </div>
                    )}
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
    </div>
  );
};

export default SubscriptionsManagementPage;
