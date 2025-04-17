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
import Select from "react-select";
import Image from "next/image";
import { countryOptions } from "~/lib/stripe";

const PaymentMethodForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);

  // Card + address fields
  const [cardName, setCardName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("AU"); // default to Australia

  // tRPC context for invalidating queries on success
  const utils = api.useContext();

  // TRPC mutations
  const initaliazeSetupIntentMutation =
    api.subscription.initializeStripeSetupIntent.useMutation();
  const savePaymentMethodMutation =
    api.subscription.savePaymentMethod.useMutation({
      onSuccess: () => {
        // Refetch saved payment methods so the UI updates automatically
        void utils.subscription.getPaymentMethods.invalidate();
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

      // 3. Confirm the card setup with full billing details
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: cardName.trim(),
            address: {
              line1: addressLine1.trim(),
              line2: addressLine2.trim(),
              city: city.trim(),
              state: state.trim(),
              postal_code: postalCode.trim(),
              country,
            },
          },
        },
      });

      if (result.error) {
        toast.error(result.error.message ?? "Failed to set up card");
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

      // 4. Save the PaymentMethod + address in your DB
      await savePaymentMethodMutation.mutateAsync({
        paymentMethodId,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country,
      });

      toast.success("Payment method added successfully");
    } catch {
      toast.error("Failed to add payment method");
    }
    setLoading(false);
  };

  // Find the selected country option based on the country state
  const selectedCountryOption = countryOptions.find(
    (option) => option.value === country,
  );

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-lg p-6">
      <div className="flex space-x-4">
        <Image
          src="/logos/visa-icon.svg"
          alt="Visa"
          width={24}
          height={24}
          className="h-6"
        />
        <Image
          src="/logos/mastercard-icon.svg"
          alt="Mastercard"
          width={24}
          height={24}
          className="h-6"
        />
        <Image
          src="/logos/amex-icon.svg"
          alt="Amex"
          width={24}
          height={24}
          className="h-6"
        />
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
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          required
        />
      </div>

      {/* Address Line 1 */}
      <div>
        <label
          htmlFor="addressLine1"
          className="mb-1 block text-sm font-medium"
        >
          Address Line 1
        </label>
        <input
          type="text"
          id="addressLine1"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          placeholder="123 Main St"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          required
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label
          htmlFor="addressLine2"
          className="mb-1 block text-sm font-medium"
        >
          Address Line 2
        </label>
        <input
          type="text"
          id="addressLine2"
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          placeholder="Apartment, suite, etc. (optional)"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
        />
      </div>

      {/* City + State */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <label htmlFor="city" className="mb-1 block text-sm font-medium">
            City
          </label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Sydney"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            required
          />
        </div>
        <div className="flex-1">
          <label htmlFor="state" className="mb-1 block text-sm font-medium">
            State
          </label>
          <input
            type="text"
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="NSW"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            required
          />
        </div>
      </div>

      {/* Postal Code */}
      <div>
        <label htmlFor="postalCode" className="mb-1 block text-sm font-medium">
          Postal/ZIP Code
        </label>
        <input
          type="text"
          id="postalCode"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="2000"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          required
        />
      </div>

      {/* Country using react-select */}
      <div>
        <label className="mb-1 block text-sm font-medium">Country</label>
        <Select
          instanceId="country-select-instance"
          options={countryOptions}
          value={selectedCountryOption}
          onChange={(option) => setCountry(option?.value ?? "")}
          styles={{
            menu: (provided) => ({
              ...provided,
              maxHeight: "200px",
              overflowY: "auto",
            }),
            control: (provided) => ({
              ...provided,
              cursor: "pointer",
            }),
          }}
          className="w-full"
          placeholder="Select country..."
        />
      </div>

      {/* Card Number */}
      <div>
        <label className="mb-1 block text-sm font-medium">Card number</label>
        <div className="rounded-md border border-gray-300 bg-white p-3 shadow-sm">
          <CardNumberElement
            options={{
              showIcon: true,
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

      {/* Expiration + CVC */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            Expiration date
          </label>
          <div className="rounded-md border border-gray-300 bg-white p-3 shadow-sm">
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
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">
            Security code
          </label>
          <div className="rounded-md border border-gray-300 bg-white p-3 shadow-sm">
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
