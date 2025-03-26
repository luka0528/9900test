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
import { CreditCard, Plus } from "lucide-react";

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isSubscribed?: boolean;
  selectedTier: string | null;
  service: any; // or your typed Service
  paymentMethods: any[]; // or typed PaymentMethod[]
  selectedPaymentMethod: string | null;
  setSelectedPaymentMethod: (id: string) => void;
  autoRenew: boolean;
  setAutoRenew: (val: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

const PaymentMethodDialog: React.FC<PaymentMethodDialogProps> = ({
  isOpen,
  onClose,
  isSubscribed,
  selectedTier,
  service,
  paymentMethods,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  autoRenew,
  setAutoRenew,
  onConfirm,
  isPending,
}) => {
  // Find the selected tier object for price display
  const tier = service.subscriptionTiers.find(
    (t: any) => t.id === selectedTier,
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="min-h-[60vh] max-w-6xl space-y-6 p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="mb-2 text-center text-2xl font-bold">
            {isSubscribed
              ? `Change Subscription Tier for ${service.name}: ${tier?.name}`
              : `Purchase ${service.name}: ${tier?.name}`}
          </AlertDialogTitle>
          <AlertDialogDescription className="mx-auto max-w-md text-center text-sm text-gray-500">
            {isSubscribed
              ? "You are already subscribed to this service. You will be changing to a new subscription tier."
              : "Select one of your saved payment methods or add a new one below."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Payment Methods */}
        <div className="space-y-4">
          {paymentMethods.length > 0 ? (
            <div className="flex w-full flex-col space-y-3">
              {paymentMethods.map((pm: any) => (
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

              {/* Add Payment Method */}
              <Button
                variant="default"
                onClick={/* your link logic */ undefined}
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
                onClick={/* your link logic */ undefined}
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
          <p className="text-lg font-bold text-gray-700 sm:mr-4">
            Price:{" "}
            <span className="font-medium">${tier?.price?.toFixed(2)}</span>
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
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={
              !selectedPaymentMethod || isPending || paymentMethods.length === 0
            }
            className="transition-colors hover:bg-green-400 hover:text-white"
          >
            {isPending ? "Processing..." : isSubscribed ? "Update" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentMethodDialog;
