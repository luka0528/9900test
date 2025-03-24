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
import SavedPaymentMethods from "~/components/billing/SavedPaymentMethods";
import PaymentMethodForm from "~/components/billing/PaymentMethodForm";
import { CreditCard } from "lucide-react";

// Load your Stripe public key from an environment variable.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

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
                <div className="mt-16 rounded-md p-4">
                  <h3 className="mb-2 pl-2 text-lg font-semibold">
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
