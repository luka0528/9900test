"use client";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Package, User, Settings, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import ManageSubscriptionDialog from "~/components/billing/ManageSubscriptionDialog";
import { SubscriptionTier } from "@prisma/client";
import React from "react";

interface ServiceManagementCardProps {
  service: {
    id: string;
    name: string;
    tierName: string;
    tags: string[];
    showManageDialog: boolean;
    setShowManageDialog: (show: boolean) => void;
    subscriptionTier: SubscriptionTier;
    refetch: () => void;
  };
}

export const ServiceManagementCard = ({
  service,
}: ServiceManagementCardProps) => {
  const router = useRouter();
  const {
    id,
    name,
    tierName,
    tags,
    showManageDialog,
    setShowManageDialog,
    subscriptionTier,
    refetch,
  } = service;

  const navigateToService = () => {
    router.push(`/service/${id}`);
  };

  const openServiceSettings = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Stop the click from bubbling to the card
    e.stopPropagation();
    setShowManageDialog(true);
  };

  return (
    <>
      <Card
        className="overflow-hidden transition-all duration-300 hover:cursor-pointer hover:shadow-lg"
        onClick={navigateToService}
      >
        <CardHeader className="min-h-[5rem] pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold">{name}</CardTitle>
            </div>
            <Badge variant="outline">{tierName}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex flex-wrap gap-2 pb-4">
            {tags && tags.length > 0 ? (
              tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No tags</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex border-t bg-muted/40 px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={openServiceSettings}
          >
            <Settings className="h-4 w-4" />
            Manage Subscription
          </Button>
          <Button variant="ghost" size="sm" className="gap-1">
            View details
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Render the modal outside of the Card to avoid event propagation issues */}
      {showManageDialog && (
        <ManageSubscriptionDialog
          isOpen={showManageDialog}
          onClose={() => setShowManageDialog(false)}
          subscriptionTier={subscriptionTier}
          refetchSubscriptions={refetch}
        />
      )}
    </>
  );
};
