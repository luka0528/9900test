"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

// Example list of countries. You can localize or fetch dynamically.
const COUNTRY_OPTIONS = [
  { code: "AU", name: "Australia" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
];

const PaymentMethodForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [cardName, setCardName] = useState("");
  const [country, setCountry] = useState("AU"); // default to Australia

  // tRPC context to invalidate queries on success
  const utils = api.useContext();

  // TRPC mutations
  const initaliazeSetupIntentMutation =
    api.user.initializeSetupIntent.useMutation();
  const savePaymentMethodMutation = api.user.savePaymentMethod.useMutation({
    onSuccess: () => {
      // Refetch saved payment methods so the UI updates automatically
      void utils.user.getPaymentMethods.invalidate();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // 1. Create a SetupIntent on the server
      const { clientSecret } =
        await initaliazeSetupIntentMutation.mutateAsync();

      // 2. Get the card fields
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) throw new Error("Card number element not found");

      // 3. Confirm the card setup with name + country
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: cardName,
            address: {
              country, // pass the 2-letter country code
            },
          },
        },
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to set up card");
        setLoading(false);
        return;
      }

      const paymentMethodId =
        typeof result.setupIntent.payment_method === "string"
          ? result.setupIntent.payment_method
          : result.setupIntent.payment_method?.id;

      if (!paymentMethodId) {
        throw new Error("No payment method ID returned");
      }

      // 4. Save the PaymentMethod ID in your database
      await savePaymentMethodMutation.mutateAsync({ paymentMethodId });
      toast.success("Payment method added successfully");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to add payment method");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-6 rounded-lg border p-6 shadow-lg"
    >
      {/* Brand icons row */}
      <div className="flex space-x-4">
        <img src="/logos/visa-icon.svg" alt="Visa" className="h-6" />
        <img
          src="/logos/mastercard-icon.svg"
          alt="Mastercard"
          className="h-6"
        />
        <img src="/logos/amex-icon.svg" alt="Amex" className="h-6" />
      </div>

      {/* Name on Card */}
      <div>
        <label htmlFor="cardName" className="mb-1 block text-sm font-medium">
          Name on Card
        </label>
        <input
          type="text"
          id="cardName"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="John Doe"
          className="block w-full rounded-md border px-3 py-2 shadow-sm"
          required
        />
      </div>

      {/* Card Number */}
      <div>
        <label className="mb-1 block text-sm font-medium">Card number</label>
        <div className="rounded-md border p-3 shadow-sm">
          <CardNumberElement
            options={{
              showIcon: true,
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1f2937", // text-gray-800
                  "::placeholder": {
                    color: "#9ca3af", // text-gray-400
                  },
                },
                invalid: {
                  color: "#ef4444", // red
                },
              },
            }}
          />
        </div>
      </div>

      {/* Expiration + CVC in one row */}
      <div className="flex space-x-4">
        {/* Expiration date */}
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            Expiration date
          </label>
          <div className="rounded-md border p-3 shadow-sm">
            <CardExpiryElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#1f2937",
                    "::placeholder": {
                      color: "#9ca3af",
                    },
                  },
                  invalid: {
                    color: "#ef4444",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Security code */}
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            Security code
          </label>
          <div className="rounded-md border p-3 shadow-sm">
            <CardCvcElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#1f2937",
                    "::placeholder": {
                      color: "#9ca3af",
                    },
                  },
                  invalid: {
                    color: "#ef4444",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="mb-1 block text-sm font-medium">Country</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="block w-full rounded-md border bg-white px-3 py-2 shadow-sm hover:cursor-pointer"
        >
          {COUNTRY_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Submit button */}
      <Button type="submit" disabled={!stripe || loading}>
        {loading ? "Processing..." : "Add Payment Method"}
      </Button>

      {/* "Powered by Stripe" footer */}
      <div className="mt-2 text-xs text-gray-500">
        Powered by{" "}
        <a href="https://stripe.com" className="underline">
          Stripe
        </a>
      </div>
    </form>
  );
};

export default PaymentMethodForm;
