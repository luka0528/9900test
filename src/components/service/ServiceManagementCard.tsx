"use client";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Package, Settings, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import ManageSubscriptionDialog from "~/components/billing/ManageSubscriptionDialog";
import type { ServiceConsumer, SubscriptionTier } from "@prisma/client";
import React, { useState } from "react";

interface ServiceManagementCardProps {
  service: {
    id: string;
    name: string;
    tierName: string;
    tags: string[];
    serviceConsumer: ServiceConsumer & { subscriptionTier: SubscriptionTier };
    refetch: () => void;
  };
}

export const ServiceManagementCard = ({
  service,
}: ServiceManagementCardProps) => {
  const router = useRouter();
  const { id, name, tierName, tags, serviceConsumer, refetch } = service;

  const [showManageDialog, setShowManageDialog] = useState(false);

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
        className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:cursor-pointer hover:shadow-lg"
        onClick={navigateToService}
      >
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold">{name}</CardTitle>
            </div>
            <Badge variant="outline" className="max-w-[10rem] truncate">
              {tierName}
            </Badge>
          </div>
        </CardHeader>

        {/* Content stretches to fill space */}
        <CardContent className="flex-1">
          <div className="flex flex-wrap gap-2">
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

        {/* Footer pinned at bottom */}
        <CardFooter className="flex justify-between border-t bg-muted/40 px-4 py-2">
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

      {showManageDialog && (
        <ManageSubscriptionDialog
          isOpen={showManageDialog}
          onClose={() => setShowManageDialog(false)}
          serviceConsumer={serviceConsumer}
          refetchSubscriptions={refetch}
        />
      )}
    </>
  );
};
