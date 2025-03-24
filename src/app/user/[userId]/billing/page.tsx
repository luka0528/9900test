"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "~/trpc/react";

// ShadCN UI imports (adjust paths as needed):
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";

import BillingHistory from "~/components/billing/BillingHistory"; // Your existing BillingHistory component

// Load your Stripe public key from an environment variable.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

// 1) A small component to display saved payment methods
const SavedPaymentMethods: React.FC = () => {
  const {
    data: paymentMethods,
    isLoading,
    error,
  } = api.user.getPaymentMethods.useQuery();

  if (isLoading) {
    return <div>Loading saved payment methods...</div>;
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
        <div key={method.id} className="rounded-md border p-4">
          <p className="font-medium">Method ID: {method.stripePaymentId}</p>
          {/* You can display other info here, like brand or last4 digits if you store them. */}
        </div>
      ))}
    </div>
  );
};

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
        payment_method: { card: cardElement },
      });
      if (result.error) {
        toast.error(result.error.message || "Failed to setup card");
        setLoading(false);
        return;
      }

      const paymentMethodId =
        typeof result.setupIntent.payment_method === "string"
          ? result.setupIntent.payment_method
          : result.setupIntent.payment_method?.id;

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
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="rounded-md border p-4">
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
      {/* 
        2) We give the container a minimum height to extend the page. 
        You can tweak min-h-[80vh] to suit your layout.
      */}
      <div className="container mx-auto mt-12 min-h-[80vh] max-w-7xl">
        <Card className="h-full px-10 py-8">
          <CardHeader>
            <CardTitle className="text-4xl font-bold">
              Billing Settings
            </CardTitle>
            <CardDescription>
              Manage your payment methods and view your billing history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="paymentMethods">
              <TabsList className="mb-4">
                <TabsTrigger value="paymentMethods">
                  Payment Methods
                </TabsTrigger>
                <TabsTrigger value="billingHistory">
                  Billing History
                </TabsTrigger>
              </TabsList>

              {/* Payment Methods Tab */}
              <TabsContent value="paymentMethods">
                {/* Show existing saved payment methods */}
                <div className="mb-16">
                  <h3 className="mb-2 text-lg font-semibold">
                    Saved Payment Methods
                  </h3>
                  <SavedPaymentMethods />
                </div>
                <hr className="my-4" />
                {/* Form to add a new payment method */}
                <div className="mt-16">
                  <h3 className="mb-2 text-lg font-semibold">
                    Add a New Payment Method
                  </h3>
                  <PaymentMethodForm />
                </div>
              </TabsContent>

              {/* Billing History Tab */}
              <TabsContent value="billingHistory">
                <BillingHistory />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Elements>
  );
};

export default BillingPage;
