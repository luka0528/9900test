"use client";

import React, { useState } from "react";
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
      return "default";
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

  // 1) Sort state: field can be "date" or "to"; order can be "asc" or "desc"
  const [sortField, setSortField] = useState<"date" | "to">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 2) Handler to switch sort field/order
  const handleSort = (field: "date" | "to") => {
    if (sortField === field) {
      // Toggle asc/desc if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Switch to a new field, reset to ascending
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // 3) Sort the data based on sortField + sortOrder
  const sortedData = React.useMemo(() => {
    if (!data) return [];

    return [...data].sort((a, b) => {
      if (sortField === "date") {
        const aDate = new Date(a.date).getTime();
        const bDate = new Date(b.date).getTime();
        return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
      } else {
        // Sorting by "to"
        const aTo = a.to.name ?? "";
        const bTo = b.to.name ?? "";
        return sortOrder === "asc"
          ? aTo.localeCompare(bTo)
          : bTo.localeCompare(aTo);
      }
    });
  }, [data, sortField, sortOrder]);

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

  if (!sortedData || sortedData.length === 0) {
    return <div>No billing history found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {/* 4) Clickable headers for date & to */}
          <TableHead
            className="cursor-pointer hover:underline"
            onClick={() => handleSort("date")}
          >
            Date
            {sortField === "date" && (sortOrder === "asc" ? " ↑" : " ↓")}
          </TableHead>
          <TableHead>From</TableHead>
          <TableHead
            className="cursor-pointer hover:underline"
            onClick={() => handleSort("to")}
          >
            To
            {sortField === "to" && (sortOrder === "asc" ? " ↑" : " ↓")}
          </TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Auto Renewal</TableHead>
          <TableHead>Renewal Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((receipt) => (
          <TableRow key={receipt.id}>
            <TableCell>{new Date(receipt.date).toLocaleString()}</TableCell>
            <TableCell>{receipt.from.name ?? "-"}</TableCell>
            <TableCell>{receipt.to.name ?? "-"}</TableCell>
            <TableCell>{`$${receipt.amount}`}</TableCell>
            <TableCell>{receipt.description}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(receipt.status)}>
                {receipt.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BillingHistory;
