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
import { CreditCard, Edit, Trash } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import PaymentMethodDialog from "./PaymentMethodDialog";
import TiersGrid from "./TiersGrid";
import type {
  SubscriptionTier,
  PaymentMethod,
  ServiceConsumer,
} from "@prisma/client";
import { useMakePayment } from "~/lib/hooks/useMakePayment";

interface ManageSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceConsumer: ServiceConsumer & { subscriptionTier: SubscriptionTier };
  refetchSubscriptions: () => void;
}

const ManageSubscriptionDialog: React.FC<ManageSubscriptionDialogProps> = ({
  isOpen,
  onClose,
  serviceConsumer,
  refetchSubscriptions,
}) => {
  // Local states
  const [showPaymentDialog, setShowPaymentDialog] = useState<boolean>(false);
  const [showTierDialog, setShowTierDialog] = useState<boolean>(false);
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [selectedNewTier, setSelectedNewTier] = useState<string | null>(null);

  // Query service details; only run when the consumer is available
  const { data: service } = api.service.getServiceById.useQuery(
    serviceConsumer.subscriptionTier.serviceId,
  );

  // Query saved payment methods
  const { data: paymentMethodsData, status: getPaymentMethodsStatus } =
    api.subscription.getPaymentMethods.useQuery();

  const { data: priceData } = api.subscription.isNewTierLower.useQuery({
    oldTierId: serviceConsumer.subscriptionTier.id,
    newTierId: selectedNewTier ?? "",
  });

  const { makePayment } = useMakePayment();

  useEffect(() => {
    if (getPaymentMethodsStatus === "success" && paymentMethodsData) {
      setPaymentMethods(paymentMethodsData);
    }
  }, [getPaymentMethodsStatus, paymentMethodsData]);

  useEffect(() => {
    if (serviceConsumer) {
      setSelectedNewTier(serviceConsumer.subscriptionTier.id);
      setAutoRenew(serviceConsumer.renewingSubscription);
      if (serviceConsumer.paymentMethodId) {
        setSelectedPaymentMethod(serviceConsumer.paymentMethodId);
      }
    }
  }, [serviceConsumer]);

  // Mutation for updating payment method
  const updatePaymentMethodMutation =
    api.subscription.updateSubscriptionPaymentMethod.useMutation();
  // Mutation for switching tiers
  const switchSubscriptionTierMutation =
    api.subscription.switchSubscriptionTier.useMutation();
  // Mutation for unsubscribing
  const unsubscribeMutation = api.subscription.unsubscribeToTier.useMutation();

  // Handler for updating the payment method
  const handlePaymentMethodUpdate = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }
    try {
      await updatePaymentMethodMutation.mutateAsync({
        subscriptionTierId: serviceConsumer.subscriptionTier.id,
        paymentMethodId: selectedPaymentMethod,
        autoRenewal: autoRenew,
        // autoRenewal: autoRenew, // Uncomment if your mutation accepts autoRenewal
      });
      toast.success("Payment method updated successfully.");
      refetchSubscriptions();
      setShowPaymentDialog(false);
    } catch {
      toast.error("Failed to update payment method.");
    }
  };

  // Handler for switching tiers
  const handleSwitchSubscriptionTier = async () => {
    if (!selectedNewTier) {
      toast.error("Please select a new tier.");
      return;
    }
    try {
      if (!priceData?.isLower) {
        const res = await makePayment(
          selectedNewTier,
          selectedPaymentMethod ?? "",
        );
        if (!res) {
          toast.error("Payment failed. Please try again.");
          return;
        }
      }

      await switchSubscriptionTierMutation.mutateAsync({
        oldTierId: serviceConsumer.subscriptionTier.id,
        newTierId: selectedNewTier,
      });
      toast.success("Subscription tier updated successfully.");
      refetchSubscriptions();
      setShowTierDialog(false);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update subscription tier.");
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await unsubscribeMutation.mutateAsync({
        subscriptionTierId: serviceConsumer.subscriptionTier.id,
      });
      toast.success("Subscription cancelled successfully.");
      refetchSubscriptions();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel subscription.");
    }
  };

  return (
    <>
      {/* Main Manage Subscription Dialog */}
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="min-h-[40vh] max-w-2xl space-y-6 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">
              Manage Subscription
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500">
              Subscription for{" "}
              <strong>{serviceConsumer.subscriptionTier.name}</strong> at $
              {serviceConsumer.subscriptionTier.price.toFixed(2)}. Next billing
              date: TBA.
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
            <Button variant="destructive" onClick={handleCancelSubscription}>
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
      {showPaymentDialog && serviceConsumer && (
        <PaymentMethodDialog
          isOpen={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setAutoRenew(true);
          }}
          isSubscribed={true}
          subscriptionTier={serviceConsumer.subscriptionTier}
          paymentMethods={paymentMethods}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          autoRenew={autoRenew}
          setAutoRenew={setAutoRenew}
          onConfirm={handlePaymentMethodUpdate}
          isPending={updatePaymentMethodMutation.isPending}
          title="Update Payment Method"
          description="Select a new payment method for your subscription."
        />
      )}

      {/* Tier Change Modal using TiersGrid */}
      {showTierDialog && serviceConsumer && service && (
        <AlertDialog open={showTierDialog} onOpenChange={setShowTierDialog}>
          <AlertDialogContent className="min-h-[55vh] max-w-4xl space-y-6 p-12">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-2xl font-bold">
                {service.name}
              </AlertDialogTitle>
              <AlertDialogDescription className="mx-auto max-w-md text-center text-sm text-gray-500">
                Select a new tier below to switch your subscription.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <TiersGrid
                service={service}
                isSubscribed={true}
                currentTierId={selectedNewTier}
                onSelectTier={(tierId: string) => {
                  setSelectedNewTier(tierId);
                }}
              />
            </div>
            <AlertDialogFooter className="flex justify-end space-x-2 pt-2">
              <AlertDialogCancel onClick={() => setShowTierDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleSwitchSubscriptionTier}>
                Switch Tier
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default ManageSubscriptionDialog;
