"use client";

import React from "react";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

// Helper to map billing status to a badge variant
function getStatusVariant(
  status: string,
): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "PAID":
      return "default"; // or "secondary"
    case "FAILED":
      return "destructive";
    case "PENDING":
      return "secondary";
    case "PROCESSING":
      return "outline";
    default:
      return "default";
  }
}

const BillingHistory: React.FC = () => {
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

  if (!data || data.length === 0) {
    return <div>No billing history found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Auto Renewal</TableHead>
          <TableHead>Renewal Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((receipt) => (
          <TableRow key={receipt.id}>
            <TableCell>{new Date(receipt.date).toLocaleString()}</TableCell>
            <TableCell>{receipt.from || "-"}</TableCell>
            <TableCell>{receipt.to || "-"}</TableCell>
            <TableCell>{`$${receipt.amount}`}</TableCell>
            <TableCell>{receipt.description}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(receipt.status)}>
                {receipt.status}
              </Badge>
            </TableCell>
            <TableCell>{receipt.automaticRenewal ? "Yes" : "No"}</TableCell>
            <TableCell>
              {receipt.automaticRenewalDate
                ? new Date(receipt.automaticRenewalDate).toLocaleString()
                : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BillingHistory;
