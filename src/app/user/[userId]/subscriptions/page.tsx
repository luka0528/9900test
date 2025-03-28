"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Loader2, CreditCard, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";

// Types you might have (simplified)
interface Subscription {
  id: string;
  serviceName: string;
  tierName: string;
  paymentMethodId?: string;
  paymentMethod?: {
    id: string;
    cardBrand?: string;
    last4?: string;
    cardholderName?: string;
  };
  autoRenew: boolean;
  // ...other fields like nextBillingDate, etc.
}

const ManageSubscriptionsPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();

  // 1) Fetch the user's subscriptions
  const { data: userData, isLoading, error } = api.user.getProfile.useQuery();

  // 2) We'll also fetch all PaymentMethods for changing payment method
  const { data: paymentMethods } = api.user.getPaymentMethods.useQuery();

  // 3) tRPC mutations for updating tier, updating payment method, removing subscription
  const updateTierMutation = api.user.updateSubscriptionTier.useMutation();
  const updatePaymentMethodMutation =
    api.user.updateSubscriptionPaymentMethod.useMutation();
  const removeSubscriptionMutation = api.user.cancelSubscription.useMutation();

  // Local state for controlling various modals
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  // We'll store the current subscription being edited
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);

  // For changing tier
  const [newTierId, setNewTierId] = useState<string | null>(null);

  // For changing payment method
  const [newPaymentMethodId, setNewPaymentMethodId] = useState<string | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-gray-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading your subscriptions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading subscriptions: {error.message}
      </div>
    );
  }

  // 4) Handlers
  const handleUpdateTier = async () => {
    if (!currentSub || !newTierId) return;
    try {
      await updateTierMutation.mutateAsync({
        subscriptionId: currentSub.id,
        newTierId,
      });
      toast.success("Tier updated successfully");
      setShowTierDialog(false);
      router.refresh(); // re-fetch data
    } catch (err) {
      console.error(err);
      toast.error("Failed to update tier");
    }
  };

  const handleUpdatePaymentMethod = async () => {
    if (!currentSub || !newPaymentMethodId) return;
    try {
      await updatePaymentMethodMutation.mutateAsync({
        subscriptionId: currentSub.id,
        paymentMethodId: newPaymentMethodId,
      });
      toast.success("Payment method updated successfully");
      setShowPaymentDialog(false);
      router.refresh(); // re-fetch data
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payment method");
    }
  };

  const handleRemoveSubscription = async () => {
    if (!currentSub) return;
    try {
      await removeSubscriptionMutation.mutateAsync({
        subscriptionId: currentSub.id,
      });
      toast.success("Subscription removed");
      setShowRemoveDialog(false);
      router.refresh(); // re-fetch data
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove subscription");
    }
  };

  return (
    <div className="container mx-auto mt-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Manage Your Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!subscriptions || subscriptions.length === 0 ? (
            <p>You have no active subscriptions.</p>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded border p-4"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{sub.serviceName}</span>
                    <span className="text-sm text-gray-600">
                      Tier: {sub.tierName}
                    </span>
                    <span className="text-sm text-gray-600">
                      Payment:{" "}
                      {sub.paymentMethod
                        ? sub.paymentMethod.cardBrand
                          ? `${sub.paymentMethod.cardBrand} **** ${sub.paymentMethod.last4}`
                          : `ID: ${sub.paymentMethod.id}`
                        : "N/A"}
                    </span>
                    <span className="text-sm text-gray-600">
                      Auto-Renew: {sub.autoRenew ? "Yes" : "No"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {/* Change tier */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentSub(sub);
                        setShowTierDialog(true);
                      }}
                    >
                      Change Tier
                    </Button>
                    {/* Change payment */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentSub(sub);
                        setShowPaymentDialog(true);
                      }}
                    >
                      <CreditCard className="mr-1 h-4 w-4" />
                      Change Payment
                    </Button>
                    {/* Remove subscription */}
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setCurrentSub(sub);
                        setShowRemoveDialog(true);
                      }}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for changing tier */}
      <AlertDialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Subscription Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Pick a new tier for your subscription to {currentSub?.serviceName}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Example: you might fetch a list of available tiers for this service */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              New Tier
            </label>
            {/* For demonstration, we'll hard-code some tiers.
                Or you might fetch them from a route like api.service.getTiers(serviceId). */}
            <Select onValueChange={(val) => setNewTierId(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tier_basic">Basic</SelectItem>
                <SelectItem value="tier_pro">Pro</SelectItem>
                <SelectItem value="tier_enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setShowTierDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateTier} disabled={!newTierId}>
              {updateTierMutation.isLoading ? "Updating..." : "Update Tier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for changing payment method */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Select a saved payment method for {currentSub?.serviceName}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            {!paymentMethods || paymentMethods.length === 0 ? (
              <p className="text-sm text-gray-500">
                No payment methods found. <br />
                <Button
                  variant="default"
                  onClick={() =>
                    router.push(`/user/${session?.user.id}/billing`)
                  }
                >
                  Add Payment Method
                </Button>
              </p>
            ) : (
              <Select onValueChange={(val) => setNewPaymentMethodId(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((pm: any) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.cardBrand
                        ? `${pm.cardBrand} **** ${pm.last4}`
                        : `Payment ID: ${pm.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdatePaymentMethod}
              disabled={!newPaymentMethodId}
            >
              {updatePaymentMethodMutation.isLoading
                ? "Updating..."
                : "Update Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for removing subscription */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your subscription to{" "}
              {currentSub?.serviceName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveSubscription}>
              {removeSubscriptionMutation.isLoading ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageSubscriptionsPage;
