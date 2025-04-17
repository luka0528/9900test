"use client";

import React from "react";
import { api } from "~/trpc/react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

// Helper function: Returns true if card expires within 3 months
function isExpiringSoon(expMonth: number, expYear: number) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-based
  const currentYear = now.getFullYear();

  // Convert both dates to an absolute "month count" (year*12 + month)
  const currentTotalMonths = currentYear * 12 + currentMonth;
  const cardTotalMonths = expYear * 12 + expMonth;

  // The difference in months between now and the card's expiry
  const diff = cardTotalMonths - currentTotalMonths;

  // Show "Expiring soon" if 0 <= diff <= 3
  return diff >= 0 && diff <= 3;
}

const SavedPaymentMethods: React.FC = () => {
  // Fetch saved payment methods
  const {
    data: paymentMethods,
    isLoading,
    error,
    refetch,
  } = api.subscription.getPaymentMethods.useQuery();

  // Set up a delete mutation
  const deletePaymentMethodMutation =
    api.subscription.deletePaymentMethod.useMutation({
      onSuccess: () => {
        // Automatically refetch payment methods after deletion
        void refetch();
      },
    });

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading saved payment methods...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  if (!paymentMethods || paymentMethods.length === 0) {
    return <div>No payment methods saved yet.</div>;
  }

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <AlertDialog key={method.id}>
          <div className="flex items-center justify-between rounded-md border p-4">
            {/* Left side: card icon + details */}
            <div className="flex items-center space-x-4">
              <CreditCard className="h-6 w-6 text-gray-600" />
              <div className="flex flex-col">
                {/* Card brand & last 4 */}
                <p className="font-medium">
                  {method.cardBrand
                    ? `**** **** **** ${method.last4}`
                    : `Card ending in ${method.last4}`}
                </p>
                {/* Expiration date + "Expiring soon" */}
                {method.expMonth && method.expYear && (
                  <p className="text-sm text-gray-500">
                    Expires {String(method.expMonth).padStart(2, "0")}/
                    {String(method.expYear).slice(-2)}
                    {isExpiringSoon(method.expMonth, method.expYear) && (
                      <span className="ml-2 text-red-600">Expiring soon</span>
                    )}
                  </p>
                )}
                {/* Cardholder name */}
                {method.cardholderName && (
                  <p className="text-sm text-gray-500">
                    Cardholder: {method.cardholderName}
                  </p>
                )}
                {/* Address fields */}
                {(method.addressLine1 ?? method.addressLine2) && (
                  <p className="text-sm text-gray-500">
                    {method.addressLine1}
                    {method.addressLine2 ? `, ${method.addressLine2}` : ""}
                    {method.postalCode && `, ${method.postalCode}`}
                  </p>
                )}
                {(method.city ?? method.state ?? method.postalCode) && (
                  <p className="text-sm text-gray-500">
                    {method.city && `${method.city}`}
                    {method.state && `, ${method.state}`}
                    {method.country && `, ${method.country}`}
                  </p>
                )}
              </div>
            </div>

            {/* Right side: Delete button triggers the AlertDialog */}
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-500 hover:text-white"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
          </div>

          {/* The AlertDialogContent (the confirm modal) */}
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this payment method? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  try {
                    await deletePaymentMethodMutation.mutateAsync({
                      paymentMethodId: method.id,
                    });
                    toast.success("Payment method deleted.");
                  } catch (err) {
                    toast.error("Failed to delete payment method.");
                    console.error(err);
                  }
                }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </div>
  );
};

export default SavedPaymentMethods;
