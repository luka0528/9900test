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
  "10,000 API calls/month",
  "24/7 Customer Service",
  "All end routes",
  "Detailed Analytics",
  "0.04c per additional API call",
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {service.subscriptionTiers
          .slice()
          .sort((a: any, b: any) => a.price - b.price) // Sort ascending by price
          .map((tier: any) => {
            const isCurrent = currentTierId === tier.id;
            return (
              <div
                key={tier.id}
                className={`flex min-h-[55vh] flex-col justify-between rounded-lg border p-6 text-center shadow-sm transition-shadow hover:shadow-md ${
                  isCurrent ? "border-gray-300 bg-gray-100" : ""
                }`}
              >
                {/* Top section: title, price, features */}
                <div>
                  <h4 className="mb-2 text-xl font-bold">{tier.name}</h4>
                  <p className="mb-4 text-3xl font-extrabold">${tier.price}</p>

                  <ul className="mb-6 space-y-2 text-sm text-gray-600">
                    {placeholderFeatures.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>

                {/* Bottom section: button */}
                <div>
                  {isCurrent ? (
                    <Button variant="outline" disabled>
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
