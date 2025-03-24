"use client";

import React from "react";
import { api } from "~/trpc/react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ShadCN UI imports
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

const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const SavedPaymentMethods: React.FC = () => {
  // Fetch saved payment methods
  const {
    data: paymentMethods,
    isLoading,
    error,
    refetch,
  } = api.user.getPaymentMethods.useQuery();

  // Set up a delete mutation
  const deletePaymentMethodMutation = api.user.deletePaymentMethod.useMutation({
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
                <p className="font-medium">
                  {method.cardBrand
                    ? `**** **** **** ${method.last4}`
                    : `Card ending in ${method.last4}`}
                </p>
                {method.expMonth && method.expYear && (
                  <p className="text-sm text-gray-500">
                    Expires {method.expMonth}/{method.expYear}
                  </p>
                )}
                {method.cardholderName && (
                  <p className="text-sm text-gray-500">
                    Cardholder: {method.cardholderName}
                  </p>
                )}
              </div>
            </div>

            {/* Right side: Delete button triggers the AlertDialog */}
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
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
