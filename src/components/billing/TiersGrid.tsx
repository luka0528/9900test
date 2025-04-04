"use client";

import type { Service, SubscriptionTier } from "@prisma/client";
import React from "react";
import { Button } from "~/components/ui/button";

interface TiersGridProps {
  service: Service & { subscriptionTiers: SubscriptionTier[] };
  isSubscribed?: boolean;
  currentTierId: string | null;
  onSelectTier: (tierId: string) => void;
}

const placeholderFeatures = [
  "Direct Phone Numbers",
  "Landline Phone Numbers",
  "Corporate email addresses",
  "Prospects",
  "Chrome Extension",
];

const TiersGrid: React.FC<TiersGridProps> = ({
  service,
  isSubscribed,
  currentTierId,
  onSelectTier,
}) => {
  return (
    <div>
      <h3 className="mb-6 text-lg font-semibold">
        {isSubscribed
          ? "Change Your Subscription Tier"
          : "Choose a Subscription Tier:"}
      </h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {service.subscriptionTiers
          .slice()
          .sort((a: SubscriptionTier, b: SubscriptionTier) => a.price - b.price)
          .map((tier: SubscriptionTier) => {
            const isCurrent = currentTierId === tier.id;
            return (
              <div
                key={tier.id}
                className={`flex h-full min-h-[60vh] flex-col rounded-lg border p-6 text-center shadow-sm transition-shadow ${
                  isCurrent ? "pointer-events-none bg-gray-200 opacity-70" : ""
                }`}
              >
                {/* Upper portion */}
                <div>
                  <h4 className="mb-2 text-xl font-bold">{tier.name}</h4>
                  <p className="mb-4 text-3xl font-extrabold">${tier.price}</p>
                  <ul className="mb-6 space-y-2 text-sm text-gray-600">
                    {placeholderFeatures.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>

                {/* Bottom portion: button anchored at bottom */}
                <div className="mt-auto">
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      disabled
                      className="cursor-default"
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => {
                        if (tier.id !== currentTierId) {
                          onSelectTier(tier.id);
                        }
                      }}
                    >
                      {isSubscribed ? "Switch to This Plan" : "Subscribe"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default TiersGrid;
