"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

// UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import { Skeleton } from "~/components/ui/skeleton";

// -------------------- Zod Schema --------------------
const billingSchema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z.string().min(4, "Card number is required"),
  expiryMonth: z.string().min(1, "Expiry month is required"),
  expiryYear: z.string().min(1, "Expiry year is required"),
  cvv: z.string().min(3, "CVV is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  suburbss: z.string().min(1, "ZIP/Postal Code is required"),
  country: z.string().min(1, "Country is required"),
});

type BillingFormValues = z.infer<typeof billingSchema>;

// -------------------- Component --------------------
const BillingPage = () => {
  const router = useRouter();
  const { userId } = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  // isEditing controls read-only vs. editable state for Payment Methods
  const [isEditing, setIsEditing] = useState(false);

  // 1) Protect the route
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // 2) Query: fetch existing billing info
  const { data: billingData, isLoading: isLoadingBilling } =
    api.user.getBillingInfo.useQuery(
      { userId: userId as string },
      { enabled: !!userId },
    );

  // 2a) Query: fetch billing history
  const { data: billingHistoryData, isLoading: isLoadingBillingHistory } =
    api.user.getBillingHistory.useQuery(
      { userId: userId as string },
      { enabled: !!userId },
    );

  // 3) Mutation: update billing info
  const updateBillingMutation = api.user.updateBillingInfo.useMutation();

  // 4) Setup React Hook Form
  const form = useForm<BillingFormValues>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      streetAddress: "",
      city: "",
      state: "",
      suburbss: "",
      country: "",
    },
  });

  // 5) Populate form once we have billing data
  useEffect(() => {
    if (billingData?.success && billingData.billingInfo) {
      form.reset({
        cardholderName: billingData.billingInfo.cardholderName ?? "",
        cardNumber: billingData.billingInfo.cardNumber ?? "",
        expiryMonth: billingData.billingInfo.expiryMonth ?? "",
        expiryYear: billingData.billingInfo.expiryYear ?? "",
        cvv: billingData.billingInfo.cvv ?? "",
        streetAddress: billingData.billingInfo.streetAddress ?? "",
        city: billingData.billingInfo.city ?? "",
        state: billingData.billingInfo.state ?? "",
        suburbss: billingData.billingInfo.suburbss ?? "",
        country: billingData.billingInfo.country ?? "",
      });
    }
  }, [billingData, form]);

  // 6) Form submission handler
  const onSubmit = async (values: BillingFormValues) => {
    try {
      setLoading(true);
      const result = await updateBillingMutation.mutateAsync({
        userId: userId as string,
        ...values,
      });
      setLoading(false);

      if (result.success) {
        toast.success("Billing information updated successfully");
        setIsEditing(false); // exit editing mode on success
      } else {
        toast.error("Failed to update billing information");
      }
    } catch (error) {
      setLoading(false);
      toast.error("Failed to update billing information");
    }
  };

  // 7) If still loading session or billing data, show skeleton
  if (status === "loading" || isLoadingBilling) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    );
  }

  // 8) Render the billing page
  return (
    <Card className="mx-auto mt-12 flex h-[90%] w-full max-w-4xl justify-center px-12 shadow-lg">
      <div className="container mx-auto mt-12">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Billing Settings</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>

        <Tabs defaultValue="payment-methods" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="billing-history">Billing History</TabsTrigger>
          </TabsList>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                {isEditing
                  ? "Edit your payment details here."
                  : "View or edit your payment details here."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* IF NOT EDITING, SHOW READ-ONLY */}
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label>Cardholder Name</Label>
                      <div className="mt-1 min-h-[2rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        {billingData?.billingInfo?.cardholderName || "N/A"}
                      </div>
                    </div>
                    <div>
                      <Label>Card Number</Label>
                      <div className="mt-1 min-h-[2rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        {billingData?.billingInfo?.cardNumber || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div>
                      <Label>Expiry Month</Label>
                      <div className="mt-1 min-h-[2rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        {billingData?.billingInfo?.expiryMonth || "N/A"}
                      </div>
                    </div>
                    <div>
                      <Label>Expiry Year</Label>
                      <div className="mt-1 min-h-[2rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        {billingData?.billingInfo?.expiryYear || "N/A"}
                      </div>
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <div className="mt-1 min-h-[2rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        {billingData?.billingInfo?.cvv || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Billing Address</h3>
                    <div>
                      <Label>Street Address</Label>
                      <div className="mt-1 min-h-[2rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        {billingData?.billingInfo?.streetAddress || "N/A"}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label>City</Label>
                        <div className="mt-1 min-h-[2rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                          {billingData?.billingInfo?.city || "N/A"}
                        </div>
                      </div>
                      <div>
                        <Label>State/Province</Label>
                        <div className="mt-1 min-h-[2rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                          {billingData?.billingInfo?.state || "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label>ZIP/Postal Code</Label>
                        <div className="mt-1 min-h-[2rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                          {billingData?.billingInfo?.suburbss || "N/A"}
                        </div>
                      </div>
                      <div>
                        <Label>Country</Label>
                        <div className="mt-1 min-h-[2rem] w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                          {billingData?.billingInfo?.country || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 w-full"
                  >
                    Edit Payment Information
                  </Button>
                </div>
              ) : (
                // IF EDITING, SHOW FORM
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="cardholderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cardholder Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your name"
                                {...field}
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="1234 5678 9012 3456"
                                {...field}
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="expiryMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Month</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => {
                                    const month = String(i + 1).padStart(
                                      2,
                                      "0",
                                    );
                                    return (
                                      <SelectItem key={month} value={month}>
                                        {month}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="expiryYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Year</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 10 }, (_, i) => {
                                    const year = new Date().getFullYear() + i;
                                    return (
                                      <SelectItem
                                        key={year}
                                        value={year.toString()}
                                      >
                                        {year}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cvv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123"
                                maxLength={4}
                                {...field}
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Billing Address</h3>
                      <FormField
                        control={form.control}
                        name="streetAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123 Main St"
                                {...field}
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Sydney"
                                  {...field}
                                  required
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Province</FormLabel>
                              <FormControl>
                                <Input placeholder="NSW" {...field} required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="suburbss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP/Postal Code</FormLabel>
                              <FormControl>
                                <Input placeholder="2000" {...field} required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Australia"
                                  {...field}
                                  required
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Cancel: revert form to original values
                          setIsEditing(false);
                          if (billingData?.success && billingData.billingInfo) {
                            form.reset({
                              cardholderName:
                                billingData.billingInfo.cardholderName ?? "",
                              cardNumber:
                                billingData.billingInfo.cardNumber ?? "",
                              expiryMonth:
                                billingData.billingInfo.expiryMonth ?? "",
                              expiryYear:
                                billingData.billingInfo.expiryYear ?? "",
                              cvv: billingData.billingInfo.cvv ?? "",
                              streetAddress:
                                billingData.billingInfo.streetAddress ?? "",
                              city: billingData.billingInfo.city ?? "",
                              state: billingData.billingInfo.state ?? "",
                              suburbss: billingData.billingInfo.suburbss ?? "",
                              country: billingData.billingInfo.country ?? "",
                            });
                          }
                        }}
                        className="w-full border-gray-300 hover:bg-red-400"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="w-full hover:bg-green-400"
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="billing-history">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your past transactions and invoices.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isLoadingBillingHistory ? (
                // Show a loading state/skeleton if needed
                <div className="flex items-center justify-center p-6">
                  <p>Loading billing history...</p>
                </div>
              ) : !billingHistoryData || billingHistoryData.length === 0 ? (
                // Show a simple message if no data is returned
                <p className="p-6 text-center text-gray-600">
                  No billing history found.
                </p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            Amount
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            Invoice
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {billingHistoryData.map((txn) => (
                          <tr key={txn.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              {txn.date}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              ${txn.amount}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              {txn.description}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              {txn.status.toLowerCase() === "paid" ? (
                                <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                  Paid
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                                  {txn.status}
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-blue-500">
                              <Link
                                href={`/user/${userId}/billing/invoice/${txn.invoiceId}`}
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <Button variant="outline">Load More</Button>
                  </div>
                </>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default BillingPage;
