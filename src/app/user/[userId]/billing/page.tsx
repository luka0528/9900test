"use client";

import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "~/trpc/react";

// Load your Stripe public key from an environment variable.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const PaymentMethodForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  // TRPC mutations for creating a SetupIntent and saving the PaymentMethod.
  const initaliazeSetupIntentMutation =
    api.user.initializeSetupIntent.useMutation();
  const savePaymentMethodMutation = api.user.savePaymentMethod.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // 1. Create a SetupIntent on the server.
      const { clientSecret } =
        await initaliazeSetupIntentMutation.mutateAsync();

      // 2. Get the card details from Stripe Elements.
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      // 3. Confirm the card setup to get a PaymentMethod.
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });
      if (result.error) {
        toast.error(result.error.message || "Failed to setup card");
        setLoading(false);
        return;
      }
      const paymentMethodId =
        typeof result.setupIntent.payment_method === "string"
          ? result.setupIntent.payment_method
          : result.setupIntent.payment_method?.id; // Extract ID if it's an object

      if (!paymentMethodId) throw new Error("No payment method ID returned");

      // 4. Save the PaymentMethod ID in your database.
      await savePaymentMethodMutation.mutateAsync({ paymentMethodId });
      toast.success("Payment method added successfully");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to add payment method");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded border p-4">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <Button type="submit" disabled={!stripe || loading}>
        {loading ? "Processing..." : "Add Payment Method"}
      </Button>
    </form>
  );
};

const BillingPage: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <div className="container mx-auto mt-12 max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Billing Settings</h1>
        <PaymentMethodForm />
      </div>
    </Elements>
  );
};

export default BillingPage;
