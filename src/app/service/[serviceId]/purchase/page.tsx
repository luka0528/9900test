"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { CreditCard, Loader2, Plus } from "lucide-react";

// ShadCN UI imports
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
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
import { useSession } from "next-auth/react";

const PurchasePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const serviceId = params.serviceId as string;
  const {
    data: service,
    isLoading,
    error,
  } = api.service.getServiceById.useQuery(serviceId);

  // Fetch the user's saved payment methods
  const { data: paymentMethodsData } = api.user.getPaymentMethods.useQuery();

  // Subscribe route
  const subscribeMutation = api.service.subscribeToTier.useMutation();

  // Track which tier the user selected
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Track auto-renewal checkbox
  const [autoRenew, setAutoRenew] = useState(false);

  // Track which payment method is selected
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);

  // Control the payment dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Handle the actual purchase flow
  const handlePurchase = async () => {
    if (!selectedTier || !selectedPaymentMethod) return;
    try {
      await subscribeMutation.mutateAsync({
        serviceId,
        tierId: selectedTier,
        paymentMethodId: selectedPaymentMethod,
        autoRenewal: autoRenew,
      });
      // Possibly show a toast success
      // Then redirect
      router.push("/service/subscriptions");
    } catch (err) {
      console.error(err);
      // handle error, maybe show a toast
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-gray-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading service details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading service: {error.message}
      </div>
    );
  }

  if (!service) {
    return <div className="p-4">Service not found.</div>;
  }

  return (
    <div className="container mx-auto mt-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{service.name}</CardTitle>
          <CardDescription>
            {service.tags && service.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Show subscription tiers */}
          {service.subscriptionTiers?.length === 0 ? (
            <p>No tiers found for this service.</p>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Tiers</h3>
              <div className="flex flex-col space-y-2">
                {service.subscriptionTiers.map((tier: any) => (
                  <label
                    key={tier.id}
                    className={`flex items-center space-x-2 rounded-md border p-2 hover:bg-gray-50 ${
                      tier.isSubscribed ? "bg-green-50" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="tier"
                      value={tier.id}
                      checked={selectedTier === tier.id}
                      onChange={() => setSelectedTier(tier.id)}
                      disabled={tier.isSubscribed}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {tier.name}
                        {tier.isSubscribed && (
                          <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            Subscribed
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-gray-500">
                        ${tier.price.toFixed(2)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Button -> Single Dialog for Payment Methods */}
          {service.subscriptionTiers?.length > 0 && (
            <AlertDialog
              open={showPaymentDialog}
              onOpenChange={setShowPaymentDialog}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  className="mt-4"
                  disabled={!selectedTier || subscribeMutation.isPending}
                  onClick={() => setShowPaymentDialog(true)}
                >
                  {subscribeMutation.isPending ? "Processing..." : "Purchase"}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent className="max-w-2xl space-y-6 p-6">
                <AlertDialogHeader>
                  <AlertDialogTitle className="mb-2 text-center text-2xl font-bold">
                    Purchase {service.name}:{" "}
                    {
                      service.subscriptionTiers.find(
                        (t) => t.id === selectedTier,
                      )?.name
                    }
                  </AlertDialogTitle>
                  <AlertDialogDescription className="mx-auto max-w-md text-center text-sm text-gray-500">
                    Select one of your saved payment methods or add a new one
                    below.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Main content area: Payment methods */}
                <div className="space-y-4">
                  {paymentMethodsData && paymentMethodsData.length > 0 ? (
                    <div className="flex w-full flex-col space-y-3">
                      {paymentMethodsData.map((pm: any) => (
                        <label
                          key={pm.id}
                          className="flex items-center space-x-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={pm.id}
                            checked={selectedPaymentMethod === pm.id}
                            onChange={() => setSelectedPaymentMethod(pm.id)}
                            className="h-5 w-5 accent-gray-700"
                          />
                          <div className="flex flex-col">
                            <div className="mb-1 flex items-center space-x-2">
                              <CreditCard className="h-5 w-5 text-gray-600" />
                              <span className="text-base font-medium">
                                {pm.cardBrand
                                  ? `**** **** **** ${pm.last4}`
                                  : `Payment Method: ${pm.stripePaymentId}`}
                              </span>
                            </div>
                            {pm.cardholderName && (
                              <span className="text-sm text-gray-500">
                                Cardholder: {pm.cardholderName}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}

                      <Button
                        variant="default"
                        onClick={() =>
                          router.push(`/user/${session?.user.id}/billing`)
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Payment Method
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>No saved payment methods found.</span>
                      <Button
                        variant="default"
                        onClick={() =>
                          router.push(`/user/${session?.user.id}/billing`)
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Payment Method
                      </Button>
                    </div>
                  )}
                </div>

                {/* Separator for price & auto-renew */}
                <hr className="my-2 border-gray-200" />

                {/* Price & auto-renew row */}
                <div className="flex flex-col items-end space-y-2 sm:flex-row sm:justify-between sm:space-y-0">
                  {/* Price */}
                  <p className="text-sm text-gray-700 sm:mr-4">
                    Price:{" "}
                    <span className="font-medium">
                      $
                      {service.subscriptionTiers
                        .find((t) => t.id === selectedTier)
                        ?.price.toFixed(2)}
                    </span>
                  </p>

                  {/* Auto-renew checkbox */}
                  <label className="flex cursor-pointer items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      className="h-4 w-4 accent-green-300"
                    />
                    <span className="text-sm text-gray-700">Auto Renewal</span>
                  </label>
                </div>

                {/* Footer: confirm/cancel buttons */}
                <AlertDialogFooter className="flex w-full justify-end space-x-2 pt-2">
                  <AlertDialogCancel
                    onClick={() => setShowPaymentDialog(false)}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handlePurchase}
                    disabled={
                      !selectedPaymentMethod ||
                      subscribeMutation.isPending ||
                      (paymentMethodsData && paymentMethodsData.length === 0)
                    }
                    className="transition-colors hover:bg-green-400 hover:text-white"
                  >
                    {subscribeMutation.isPending ? "Processing..." : "Confirm"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchasePage;
