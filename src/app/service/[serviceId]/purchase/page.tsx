"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";

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

const PurchasePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const subscribeMutation = api.service.subscribeToTier.useMutation();
  const serviceId = params.serviceId as string;
  const {
    data: service,
    isLoading,
    error,
  } = api.service.getServiceById.useQuery(serviceId);

  // Track which tier the user selected
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Handle the purchase/subscribe
  const handlePurchase = async () => {
    // Step 1: CONFIRM PURCHASE/PAYMENT

    // Step 2: SUBSCRIBE
    if (!selectedTier) return;
    await subscribeMutation.mutateAsync({
      serviceId,
      tierId: selectedTier,
    });
    // Step 3: Handle success/error

    // Step 4: Send email confirmation/reciept to user

    // Step 5: Toast notification to user

    // Step 6: Redirect to subscriptions page
    router.push("/service/subscriptions");
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
            {/* If you have tags or some short description */}
            {service.tags && service.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag) => (
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
          {/* Show the subscription tiers */}
          {service?.subscriptionTiers?.length === 0 ? (
            <p>No tiers found for this service.</p>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Tiers</h3>
              <div className="flex flex-col space-y-2">
                {service?.subscriptionTiers?.map((tier) => (
                  <label
                    key={tier.id}
                    className="flex items-center space-x-2 rounded-md border p-2 hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="tier"
                      value={tier.id}
                      checked={selectedTier === tier.id}
                      onChange={() => setSelectedTier(tier.id)}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{tier.name}</span>
                      <span className="text-sm text-gray-500">
                        ${tier.price.toFixed(2)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Purchase Button */}
          {service?.subscriptionTiers?.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  className="mt-4"
                  disabled={!selectedTier || subscribeMutation.isPending}
                >
                  {subscribeMutation.isPending ? "Processing..." : "Purchase"}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to purchase the selected tier? This
                    may incur a charge.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handlePurchase}
                    disabled={!selectedTier || subscribeMutation.isPending}
                  >
                    Confirm
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
