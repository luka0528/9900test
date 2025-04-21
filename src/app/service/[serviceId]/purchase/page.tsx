"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import { api } from "~/trpc/react";
import { Loader2, ArrowLeftIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import TiersGrid from "~/components/billing/TiersGrid";
import PaymentMethodDialog from "~/components/billing/PaymentMethodDialog";
import { useMakePayment } from "~/lib/hooks/useMakePayment";

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
    refetch: serviceRefetch,
  } = api.service.getServiceById.useQuery(serviceId);

  // 2. Check if user is already subscribed to this service
  const {
    data: subscriptionStatus,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: subscriptionStatusRefetch,
  } = api.subscription.isUserSubscribedToService.useQuery({ serviceId });

  // 3. Fetch payment methods
  const { data: paymentMethodsData, isLoading: isPaymentDataLoading } =
    api.subscription.getPaymentMethods.useQuery();

  // 4. Mutation to subscribe/update subscription
  const subscribeMutation = api.subscription.subscribeToTier.useMutation();
  const { makePayment, isLoading: isPaymentLoading } = useMakePayment();

  // Local state
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentTierId, setCurrentTierId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);

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
    setIsSubscribed(!!subscriptionStatus?.isSubscribed);
  }, [subscriptionStatus]);

  // 5. The purchase/update flow
  const handlePurchase = async () => {
    try {
      if (!selectedTier || !selectedPaymentMethod) {
        toast.error("Please select a tier and payment method.");
        return;
      }
      const processPayment = await makePayment(
        selectedTier,
        selectedPaymentMethod,
      );

      if (!processPayment) return;

      await subscribeMutation.mutateAsync({
        tierId: selectedTier,
        paymentMethodId: selectedPaymentMethod,
        autoRenewal: autoRenew,
      });
      setCurrentTierId(selectedTier);
      void serviceRefetch();
      if (subscriptionStatus?.isSubscribed) {
        toast.success("Successfully updated subscription.");
      } else {
        toast.success("Successfully subscribed.");
      }
      void subscriptionStatusRefetch();
    } catch (err) {
      console.error(err);
      toast.error("Error subscribing to service.");
    }
  };

  if (!status || status === "unauthenticated") {
    router.push(`/service/${serviceId}`);
    return null;
  }

  // 6. Loading & error states
  if (serviceLoading || subscriptionLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
          <span className="mt-4 text-white">Loading...</span>
        </div>
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
      <Toaster />
      {isPaymentLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <span className="mt-4 text-white">Processing payment...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasePage;
