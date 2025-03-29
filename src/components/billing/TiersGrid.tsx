"use client";

import React from "react";
import { Button } from "~/components/ui/button";

interface TiersGridProps {
  service: any; // or your typed Service
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
          ? "You are already subscribed. Change or upgrade below:"
          : "Choose a Subscription Tier:"}
      </h3>

      {/* 
        1) "items-stretch" ensures columns match height
        2) Each card uses "min-h-[60vh]" to force at least 60% of viewport height
        3) "flex flex-col h-full justify-between" anchors the button at bottom
      */}
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
        {service.subscriptionTiers
          // Optional: sort by ascending price
          .slice()
          .sort((a: any, b: any) => a.price - b.price)
          .map((tier: any) => {
            const isCurrent = currentTierId === tier.id;
            return (
              <div
                key={tier.id}
                className={`flex h-full min-h-[60vh] flex-col rounded-lg border p-6 text-center shadow-sm transition-shadow hover:shadow-md ${
                  isCurrent ? "border-gray-300 bg-gray-100" : ""
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

                {/* Bottom portion: button anchored at the bottom */}
                <div className="mt-auto">
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      disabled
                      className="border-gray-300"
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => onSelectTier(tier.id)}
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
