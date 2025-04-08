"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Loader2, ArrowLeftIcon } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";

import TiersGrid from "~/components/billing/TiersGrid";
import PaymentMethodDialog from "~/components/billing/PaymentMethodDialog";

const PurchasePage: React.FC = () => {
  const { status } = useSession();
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;

  // 1. Fetch service details
  const {
    data: service,
    isLoading: serviceLoading,
    error: serviceError,
  } = api.service.getServiceById.useQuery(serviceId);

  // 2. Check if user is already subscribed to this service
  const {
    data: subscriptionStatus,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: subscriptionStatusRefetch,
  } = api.user.isUserSubscribedToService.useQuery({ serviceId });

  // 3. Fetch payment methods
  const { data: paymentMethodsData, isLoading: isPaymentDataLoading } =
    api.user.getPaymentMethods.useQuery();

  // 4. Mutation to subscribe/update subscription
  const subscribeMutation = api.service.subscribeToTier.useMutation();

  // Local state
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Track user's current tier in local state
  const [currentTierId, setCurrentTierId] = useState<string | null>(null);

  // Once we know subscriptionStatus, set currentTierId
  useEffect(() => {
    if (subscriptionStatus?.isSubscribed) {
      setCurrentTierId(subscriptionStatus.subscriptionTierId ?? null);
    } else {
      setCurrentTierId(null);
    }
  }, [subscriptionStatus]);

  useEffect(() => {
    if (!isPaymentDataLoading && paymentMethodsData?.[0]) {
      setSelectedPaymentMethod(paymentMethodsData[0].id);
    }
  }, [isPaymentDataLoading, paymentMethodsData]);

  useEffect(() => {
    setIsSubscribed(subscriptionStatus?.isSubscribed ?? false);
  }, [subscriptionStatus]);

  // 5. The purchase/update flow
  const handlePurchase = async () => {
    if (!selectedTier || !selectedPaymentMethod) return;
    try {
      // If user is already subscribed, pass currentTierId
      if (subscriptionStatus?.isSubscribed) {
        await subscribeMutation.mutateAsync({
          serviceId,
          newTierId: selectedTier,
          currentTierId: currentTierId ?? undefined,
          paymentMethodId: selectedPaymentMethod,
          autoRenewal: autoRenew,
        });
        toast.success("Successfully updated subscription.");
        setCurrentTierId(selectedTier); // reflect new plan immediately
      } else {
        // brand new subscription
        await subscribeMutation.mutateAsync({
          serviceId,
          newTierId: selectedTier,
          paymentMethodId: selectedPaymentMethod,
          autoRenewal: autoRenew,
        });
        toast.success("Successfully subscribed.");
        setCurrentTierId(selectedTier);
      }
      void subscriptionStatusRefetch();
      router.refresh(); // or redirect, if desired
    } catch (err) {
      console.error(err);
      toast.error("Error subscribing to service.");
    }
  };

  if (!status || status === "unauthenticated") {
    router.push(`/service/${serviceId}`);
  }

  // 6. Loading & error states
  if (serviceLoading || subscriptionLoading) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-gray-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }
  if (serviceError) {
    return (
      <div className="p-4 text-red-500">
        Error loading service: {serviceError.message}
      </div>
    );
  }
  if (subscriptionError) {
    return <div className="p-4 text-red-500">Error checking subscription.</div>;
  }
  if (!service) {
    return <div className="p-4">Service not found.</div>;
  }

  return (
    <div className="container mx-auto mt-12 max-w-5xl">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <ArrowLeftIcon
              className="cursor-pointer"
              onClick={() => router.push(`/service/${serviceId}`)}
            />
            <CardTitle className="text-3xl font-bold">{service.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {service.subscriptionTiers?.length === 0 ? (
            <p>No tiers found for this service.</p>
          ) : (
            <TiersGrid
              service={service}
              isSubscribed={isSubscribed}
              currentTierId={currentTierId}
              onSelectTier={(tierId) => {
                setSelectedTier(tierId);
                setShowPaymentDialog(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Payment Method Dialog */}
      {service.subscriptionTiers?.length > 0 && (
        <PaymentMethodDialog
          isOpen={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          isSubscribed={isSubscribed}
          subscriptionTier={
            service.subscriptionTiers.find((tier) => tier.id === selectedTier)!
          }
          paymentMethods={paymentMethodsData ?? []}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          autoRenew={autoRenew}
          setAutoRenew={setAutoRenew}
          onConfirm={handlePurchase}
          isPending={subscribeMutation.isPending}
          title={isSubscribed ? "Update Subscription" : "Purchase Subscription"}
          description={
            isSubscribed
              ? "Update your subscription details below."
              : "Select a payment method and confirm your purchase."
          }
        />
      )}
    </div>
  );
};

export default PurchasePage;
