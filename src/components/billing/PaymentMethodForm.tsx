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

// Define country options (add more if needed)
const countryOptions = [
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AO", label: "Angola" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BD", label: "Bangladesh" },
  { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" },
  { value: "BJ", label: "Benin" },
  { value: "BO", label: "Bolivia" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BR", label: "Brazil" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "CD", label: "Congo (Democratic Republic)" },
  { value: "CG", label: "Congo (Republic)" },
  { value: "CR", label: "Costa Rica" },
  { value: "HR", label: "Croatia" },
  { value: "CU", label: "Cuba" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "EE", label: "Estonia" },
  { value: "ET", label: "Ethiopia" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GR", label: "Greece" },
  { value: "GT", label: "Guatemala" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "HT", label: "Haiti" },
  { value: "HN", label: "Honduras" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "CI", label: "Ivory Coast" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KP", label: "North Korea" },
  { value: "KR", label: "South Korea" },
  { value: "KW", label: "Kuwait" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Laos" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libya" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "ML", label: "Mali" },
  { value: "MR", label: "Mauritania" },
  { value: "MX", label: "Mexico" },
  { value: "MD", label: "Moldova" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "MK", label: "North Macedonia" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PA", label: "Panama" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "QA", label: "Qatar" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russia" },
  { value: "RW", label: "Rwanda" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syria" },
  { value: "TW", label: "Taiwan" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania" },
  { value: "TH", label: "Thailand" },
  { value: "TG", label: "Togo" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TM", label: "Turkmenistan" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
];

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

      // 3. Confirm the card setup with full billing details
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: cardName,
            address: {
              line1: addressLine1,
              line2: addressLine2,
              city,
              state,
              postal_code: postalCode,
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
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
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
          onChange={(e) => setCardName(e.target.value.trim())}
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
          onChange={(e) => setAddressLine1(e.target.value.trim())}
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
          onChange={(e) => setAddressLine2(e.target.value.trim())}
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
            onChange={(e) => setCity(e.target.value.trim())}
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
            onChange={(e) => setState(e.target.value.trim())}
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
          onChange={(e) => setPostalCode(e.target.value.trim())}
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
