"use client";

import React, { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { CreditCard, Edit, Trash, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import PaymentMethodDialog from "./PaymentMethodDialog";
import ChangeTierDialog from "./ChangeTierDialog";

// Import Prisma types
import {
  SubscriptionTier,
  PaymentMethod,
  ServiceConsumer,
} from "@prisma/client";

// Create a composite type for subscription details
interface ManageSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionTier: SubscriptionTier;
  refetchSubscriptions: () => void;
}

const ManageSubscriptionDialog: React.FC<ManageSubscriptionDialogProps> = ({
  isOpen,
  onClose,
  subscriptionTier,
  refetchSubscriptions,
}) => {
  // Sub-dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState<boolean>(false);
  const [showTierDialog, setShowTierDialog] = useState<boolean>(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const {
    data: service,
    isLoading: serviceLoading,
    error: serviceError,
  } = api.service.getServiceById.useQuery(subscriptionTier.serviceId);

  // Local state for current subscription tier
  const [currentTierId, setCurrentTierId] = useState<string | null>(
    subscriptionTier.id,
  );

  // Fetch saved payment methods
  const { data: paymentMethodsData, status: getPaymentMethodsStatus } =
    api.user.getPaymentMethods.useQuery();

  useEffect(() => {
    if (getPaymentMethodsStatus === "success" && paymentMethodsData) {
      setPaymentMethods(paymentMethodsData);
    }
  }, [getPaymentMethodsStatus, paymentMethodsData]);

  useEffect(() => {
    // setAutoRenew(subscription.autoRenew);
    setCurrentTierId(subscriptionTier.id);
  }, [subscriptionTier, paymentMethods]);

  const updatePaymentMethodMutation =
    api.user.updateSubscriptionPaymentMethod.useMutation();

  const unsubscribeMutation = api.service.unsubscribeToTier.useMutation();

  const handlePaymentMethodUpdate = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }
    if (!subscriptionTier.id) {
      toast.error("No subscription tier found.");
      return;
    }
    try {
      await updatePaymentMethodMutation.mutateAsync({
        subscriptionTierId: subscriptionTier.id,
        paymentMethodId: selectedPaymentMethod,
        // autoRenewal: autoRenew,
      });
      toast.success("Payment method updated successfully.");
      refetchSubscriptions();
    } catch {
      toast.error("Failed to update payment method.");
    }
  };
  if (serviceLoading) {
    return <div>Loading...</div>;
  }
  if (serviceError) {
    return <div>Error: {serviceError.message}</div>;
  }

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="min-h-[40vh] max-w-2xl space-y-6 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">
              Manage Subscription
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              Subscription for <strong>{subscriptionTier.name}</strong> at $
              {subscriptionTier.price.toFixed(2)}. Next billing date: {" TBA"}
              {/* {subscription.nextBillingDate
                ? new Date(subscription.nextBillingDate).toLocaleDateString()
                : "TBA"} */}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col space-y-4">
            {/* Update Payment Method */}
            <Button
              variant="default"
              onClick={() => setShowPaymentDialog(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Update Payment Method
            </Button>

            {/* Change Subscription Tier */}
            <Button variant="default" onClick={() => setShowTierDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Change Subscription Tier
            </Button>

            {/* Cancel Subscription */}
            <Button
              variant="destructive"
              onClick={() =>
                unsubscribeMutation.mutateAsync({
                  subscriptionTierId: subscriptionTier.id,
                })
              }
            >
              <Trash className="mr-2 h-4 w-4" />
              Cancel Subscription
            </Button>
          </div>

          <AlertDialogFooter className="flex justify-end pt-4">
            <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Method Dialog */}
      {showPaymentDialog && (
        <PaymentMethodDialog
          isOpen={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          isSubscribed={true}
          selectedTier={subscriptionTier.id}
          service={service}
          paymentMethods={paymentMethods}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          autoRenew={autoRenew}
          setAutoRenew={setAutoRenew}
          onConfirm={handlePaymentMethodUpdate}
          isPending={updatePaymentMethodMutation.isPending}
          title="Update Subscription"
          description="Update your subscription details below."
        />
      )}

      {/* Tier Change Dialog */}
      {showTierDialog && (
        <ChangeTierDialog
          isOpen={showTierDialog}
          onClose={() => setShowTierDialog(false)}
          subscriptionTier={subscriptionTier}
          refetchSubscriptions={refetchSubscriptions}
        />
      )}
    </>
  );
};

export default ManageSubscriptionDialog;
