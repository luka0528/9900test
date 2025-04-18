// ESLint recognises certain assertions as unnecesary, however without it, they
// are being inferred as type 'unknown'.
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

import { ArrowUpDown, ChevronDown, ChevronRight, Star } from "lucide-react";
import { AvatarImage } from "~/components/ui/avatar";
import { getSession } from "next-auth/react";

export type ServiceData = {
  id: string;
  name: string;
  owners: string[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  latestVersion: {
    id: string;
    version: string;
  }
  rating: number;
  revenue: {
    total: number;
    monthly: number;
  };
  tiers: ServiceTierData[];
};

export type ServiceTierData = {
  id: string;
  name: string;
  price: number;
  numCustomers: number;
  revenue: number;
};

const session = await getSession();

export const columns: ColumnDef<ServiceData>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="ml-8"
        >
          Name
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const service = row.original.name;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <div className="flex items-center gap-2">
            <span>{service}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: "Version",
    accessorKey: "latestVersion",
    header: "Version",
  },
  {
    id: "owners",
    accessorKey: "owners",
    header: "Owners",
    cell: ({ row }) => {
      const owners = row.getValue("owners") as string[];
      return (
        // TODO: Remove useSession & instead store .src in the database (?)
        <div className="flex flex-wrap gap-2">
          {owners.map((owner) => (
            <Avatar className="h-8 w-8" key={owner}>
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      );
    },
  },
  {
    id: "tags",
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      return (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "created At",
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("created At") as Date;
      return <div className="pl-4"> {date.toLocaleDateString()} </div>;
    },
  },
  {
    id: "updated At",
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Updated At
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("updated At") as Date;
      return <div className="pl-4"> {date.toLocaleDateString()} </div>;
    },
  },
  {
    accessorKey: "rating",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rating
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number;
      return (
        <div className="flex items-center gap-2 pl-4">
          {rating.toFixed(2)}
          <Star
            className="text-yellow-400"
            fill="currentColor"
            strokeWidth={1.5}
          />
        </div>
      );
    },
  },
  {
    id: "revenue",
    accessorKey: "revenue.total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Revenue
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const revenue = row.original.revenue.total;
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "AUD",
      }).format(revenue);

      return <div className="pl-4">{formatted}</div>;
    },
  },
  //   {
  //     accessorKey: "revenue.monthly",
  //     header: ({ column }) => {
  //         return (
  //           <Button
  //             variant="ghost"
  //             onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //           >
  //             Revenue - Monthly
  //             <ArrowUpDown className="h-4 w-4" />
  //           </Button>
  //         )
  //     },
  //     cell: ({ row }) => {
  //         const revenue = row.original.revenue.monthly
  //         const formatted = new Intl.NumberFormat("en-US", {
  //             style: "currency",
  //             currency: "AUD",
  //           }).format(revenue)

  //         return <div className="pl-4">{formatted}</div>
  //     }
  //   },
  {
    id: "options",
    cell: ({ row }) => {
      const service = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(service.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View service</DropdownMenuItem>
            <DropdownMenuItem>View </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
