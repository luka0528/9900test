"use client";

import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import BillingHistory from "~/components/billing/BillingHistory";
import SavedPaymentMethods from "~/components/billing/SavedPaymentMethods";
import PaymentMethodForm from "~/components/billing/PaymentMethodForm";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react"; // Lucide icon
import { useRouter } from "next/navigation";

const BillingPage: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();

  // Show/hide the "Add Payment Method" form
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);

  // If not authorized or still loading session
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login"); // or wherever you want to redirect
    }
  }, [status, router]);

  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  );

  return (
    <Elements stripe={stripePromise}>
      <div className="container mx-auto mt-12 min-h-[80vh] max-w-6xl pb-6">
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
                {/* Existing saved payment methods */}
                <div className="mb-16">
                  <h3 className="mb-2 text-lg font-semibold">
                    Saved Payment Methods
                  </h3>
                  <SavedPaymentMethods />
                </div>

                <hr className="my-4" />

                {/* Button to reveal the Add Payment Method form */}
                {!showAddPaymentMethod ? (
                  <Button
                    onClick={() => setShowAddPaymentMethod(true)}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={"outline"}
                      className="mt-4 border-red-200 text-red-600 hover:bg-red-500 hover:text-white"
                      onClick={() => setShowAddPaymentMethod(false)}
                    >
                      Cancel
                    </Button>
                    {showAddPaymentMethod && (
                      <div className="mt-4 rounded-md border border-gray-300 bg-gray-50 p-4">
                        <h3 className="mb-2 pl-2 text-lg font-semibold">
                          Add a New Payment Method
                        </h3>
                        <PaymentMethodForm />
                      </div>
                    )}
                  </>
                )}
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
