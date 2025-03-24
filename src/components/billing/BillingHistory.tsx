"use client";

import { Loader2 } from "lucide-react";
import React from "react";
import { api } from "~/trpc/react"; // Adjust path as needed

// A small display component for billing history.
const BillingHistory: React.FC = () => {
  // Fetch the billing receipts from the server.
  const { data, isLoading, error } = api.user.getBillingHistory.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading billing history...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  // If there's no data or an empty array, show a placeholder message.
  if (!data || data.length === 0) {
    return <div>No billing history found.</div>;
  }

  return (
    <div className="space-y-4">
      {data.map((receipt) => (
        <div key={receipt.id} className="rounded border p-4">
          <p>
            <strong>Date:</strong> {new Date(receipt.date).toLocaleString()}
          </p>
          <p>
            <strong>Amount:</strong> {receipt.amount}
          </p>
          <p>
            <strong>Description:</strong> {receipt.description}
          </p>
          <p>
            <strong>Status:</strong> {receipt.status}
          </p>
          {/* Add any other fields you want to display from BillingReceipt */}
        </div>
      ))}
    </div>
  );
};

export default BillingHistory;
