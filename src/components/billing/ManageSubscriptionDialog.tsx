"use client";

import React from "react";
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

interface ManageSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: any; // Should include subscriptionTier, paymentMethod, nextBillingDate, status, etc.
  refetchSubscriptions: () => void;
}

const ManageSubscriptionDialog: React.FC<ManageSubscriptionDialogProps> = ({
  isOpen,
  onClose,
  subscription,
  refetchSubscriptions,
}) => {
  // Mutation for unsubscribing
  const unsubscribeMutation = api.service.unsubscribeToTier.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled.");
      refetchSubscriptions();
      onClose();
    },
    onError: () => toast.error("Failed to cancel subscription."),
  });

  // Placeholder functions for updating payment method and changing tier.
  const handleUpdatePaymentMethod = () => {
    toast("Update Payment Method functionality not implemented yet.");
  };

  const handleChangeTier = () => {
    toast("Change Subscription Tier functionality not implemented yet.");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="min-h-[60vh] max-w-4xl space-y-6 p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">
            Manage Subscription
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-500">
            Subscription for{" "}
            <strong>{subscription.subscriptionTier.name}</strong> at $
            {subscription.subscriptionTier.price.toFixed(2)}. Next billing date:{" "}
            {subscription.nextBillingDate
              ? new Date(subscription.nextBillingDate).toLocaleDateString()
              : "TBA"}
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col space-y-4">
          <Button variant="default" onClick={handleUpdatePaymentMethod}>
            <CreditCard className="mr-2 h-4 w-4" />
            Update Payment Method
          </Button>
          <Button variant="default" onClick={handleChangeTier}>
            <Edit className="mr-2 h-4 w-4" />
            Change Subscription Tier
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              unsubscribeMutation.mutateAsync({
                subscriptionTierId: subscription.subscriptionTierId,
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
  );
};

export default ManageSubscriptionDialog;
