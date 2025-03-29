"use client";

import React, { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { PaymentMethod, SubscriptionTier } from "@prisma/client";

interface ChangeTierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionTier: SubscriptionTier; // has subscriptionTier, subscriptionTierId, etc.
  refetchSubscriptions: () => void;
}

/**
 * Dialog to let the user pick a new subscription tier for the same service.
 * If the new tier has a cost > 0, the user must pick a payment method.
 */
const ChangeTierDialog: React.FC<ChangeTierDialogProps> = ({
  isOpen,
  onClose,
  subscriptionTier,
  refetchSubscriptions,
}) => {
  // We assume we can get the serviceId from subscription.subscriptionTier.serviceId
  // or we might fetch from a route. For now, let's assume we have it:
  const serviceId = subscriptionTier.serviceId;

  // 1) Fetch all tiers for this service
  const {
    data: service,
    isLoading,
    error,
  } = api.service.getServiceById.useQuery(serviceId);

  // 2) We also might need user payment methods if tiers > 0 require a card
  const { data: paymentMethods } = api.user.getPaymentMethods.useQuery();

  // 3) Mutation for changing the tier
  const subscribeMutation = api.service.subscribeToTier.useMutation({});

  // Local state for chosen tier + paymentMethod
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);

  const handleChangeTier = async () => {
    if (!selectedTierId) return;
    try {
      // Find the new tier
      const newTier = service?.subscriptionTiers.find(
        (t: SubscriptionTier) => t.id === selectedTierId,
      );
      if (!newTier) return;

      // If newTier.price > 0, we need a payment method
      const paymentMethodId =
        newTier.price > 0 ? selectedPaymentMethod : undefined;

      await subscribeMutation.mutateAsync({
        serviceId,
        newTierId: selectedTierId,
        currentTierId: subscriptionTier.id,
        paymentMethodId: paymentMethodId ?? undefined,
        autoRenewal: false, // or true if you want
      });

      toast.success("Subscription tier changed.");
      refetchSubscriptions();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to change subscription tier.");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-3xl space-y-6 p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">
            Change Subscription Tier
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-500">
            Pick a new tier for your subscription. If it has a cost, you must
            select a payment method.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoading && (
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading tiers...</span>
          </div>
        )}
        {error && (
          <div className="text-red-500">Failed to load service tiers.</div>
        )}

        {!isLoading && service && (
          <div className="flex flex-col space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Select a Tier:</h4>
              {service.subscriptionTiers
                .slice()
                .sort(
                  (a: SubscriptionTier, b: SubscriptionTier) =>
                    a.price - b.price,
                )
                .map((tier: SubscriptionTier) => (
                  <label
                    key={tier.id}
                    className="flex items-center space-x-3 rounded border p-2"
                  >
                    <input
                      type="radio"
                      name="tier"
                      value={tier.id}
                      checked={selectedTierId === tier.id}
                      onChange={() => setSelectedTierId(tier.id)}
                    />
                    <span>
                      {tier.name} – ${tier.price.toFixed(2)}
                    </span>
                  </label>
                ))}
            </div>

            {/* If the chosen tier has a price > 0, show payment methods */}
            {selectedTierId &&
              (() => {
                const newTier = service.subscriptionTiers.find(
                  (t: SubscriptionTier) => t.id === selectedTierId,
                );
                if (newTier && newTier.price > 0) {
                  return (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">
                        Select a Payment Method:
                      </h4>
                      {paymentMethods && paymentMethods.length > 0 ? (
                        paymentMethods.map((pm: PaymentMethod) => (
                          <label
                            key={pm.id}
                            className="flex items-center space-x-3 rounded border p-2"
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={pm.id}
                              checked={selectedPaymentMethod === pm.id}
                              onChange={() => setSelectedPaymentMethod(pm.id)}
                            />
                            <span>
                              {pm.cardBrand
                                ? `**** **** **** ${pm.last4}`
                                : pm.stripePaymentId}
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No payment methods found. You must add one first.
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
          </div>
        )}

        <AlertDialogFooter className="flex justify-end space-x-2 pt-4">
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleChangeTier}
            disabled={
              !selectedTierId ||
              subscribeMutation.isPending ||
              // If new tier has a cost, we need a payment method
              (() => {
                if (!service || !selectedTierId) return true;
                const newTier = service.subscriptionTiers.find(
                  (t: SubscriptionTier) => t.id === selectedTierId,
                );
                if (!newTier) return true;
                return newTier.price > 0 && !selectedPaymentMethod;
              })()
            }
          >
            {subscribeMutation.isPending ? "Switching..." : "Switch Tier"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ChangeTierDialog;
