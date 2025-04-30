import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TiersGrid from "~/components/billing/TiersGrid";
import type { Service, SubscriptionTier, TierFeature } from "@prisma/client";

// Mock data
const mockFeatures: TierFeature[] = [
  { id: "f1", feature: "Feature 1", subscriptionTierId: "t1" },
  { id: "f2", feature: "Feature 2", subscriptionTierId: "t1" },
];

const mockTiers: (SubscriptionTier & { features: TierFeature[] })[] = [
  {
    id: "t1",
    name: "Basic",
    price: 10,
    serviceId: "s1",
    createdAt: new Date(),
    updatedAt: new Date(),
    features: mockFeatures,
  },
  {
    id: "t2",
    name: "Pro",
    price: 20,
    serviceId: "s1",
    createdAt: new Date(),
    updatedAt: new Date(),
    features: mockFeatures,
  },
  {
    id: "t3",
    name: "Premium",
    price: 30,
    serviceId: "s1",
    createdAt: new Date(),
    updatedAt: new Date(),
    features: mockFeatures,
  },
];

const mockService: Service & {
  subscriptionTiers: (SubscriptionTier & { features: TierFeature[] })[];
} = {
  id: "s1",
  name: "Test Service",
  createdAt: new Date(),
  updatedAt: new Date(),
  masterAPIKey: null,
  baseEndpoint: "https://api.example.com",
  subscriptionTiers: mockTiers,
};

describe("TiersGrid Component", () => {
  it("renders correctly with subscription tiers", () => {
    render(
      <TiersGrid
        service={mockService}
        isSubscribed={false}
        currentTierId={null}
        onSelectTier={() => {}}
      />,
    );

    expect(screen.getByText("Choose a Subscription Tier:")).toBeInTheDocument();

    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("$10")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("$20")).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("$30")).toBeInTheDocument();

    mockFeatures.forEach((feature) => {
      expect(screen.getAllByText(feature.feature).length).toBe(
        mockTiers.length,
      );
    });
  });

  it('displays "Change Your Subscription Tier" when isSubscribed is true', () => {
    render(
      <TiersGrid
        service={mockService}
        isSubscribed={true}
        currentTierId={null}
        onSelectTier={() => {}}
      />,
    );

    expect(
      screen.getByText("Change Your Subscription Tier"),
    ).toBeInTheDocument();
  });

  it("sorts tiers by price ascending", () => {
    render(
      <TiersGrid
        service={mockService}
        isSubscribed={false}
        currentTierId={null}
        onSelectTier={() => {}}
      />,
    );

    const tierElements = screen.getAllByRole("heading", { level: 4 });
    expect(tierElements[0]?.textContent).toBe("Basic");
    expect(tierElements[1]?.textContent).toBe("Pro");
    expect(tierElements[2]?.textContent).toBe("Premium");
  });

  it('disables current tier and shows "Current Plan" button', () => {
    render(
      <TiersGrid
        service={mockService}
        isSubscribed={true}
        currentTierId="t1"
        onSelectTier={() => {}}
      />,
    );

    const currentPlanButton = screen.getByText("Current Plan");
    expect(currentPlanButton).toBeDisabled();
    const tierCard = currentPlanButton.closest('div[class*="flex"]');
    expect(tierCard).toHaveClass("opacity-70");
    expect(tierCard).toHaveClass("pointer-events-none");
  });

  it("calls onSelectTier when clicking Subscribe button", () => {
    const onSelectTier = vi.fn();
    render(
      <TiersGrid
        service={mockService}
        isSubscribed={false}
        currentTierId={null}
        onSelectTier={onSelectTier}
      />,
    );

    const subscribeButtons = screen.getAllByText("Subscribe");
    const subscribeButton = subscribeButtons[0];

    if (!subscribeButton) {
      throw new Error('No "Subscribe" button found in the rendered component');
    }

    fireEvent.click(subscribeButton);
    expect(onSelectTier).toHaveBeenCalledWith("t1");
  });

  it("calls onSelectTier when clicking Switch to This Plan button", () => {
    const onSelectTier = vi.fn();
    render(
      <TiersGrid
        service={mockService}
        isSubscribed={true}
        currentTierId="t1"
        onSelectTier={onSelectTier}
      />,
    );

    const proTierCard = screen.getByText("Pro").closest('div[class*="flex"]');
    const switchButton = proTierCard?.querySelector("button");

    if (!switchButton) {
      throw new Error('No "Switch to This Plan" button found in Pro tier');
    }

    fireEvent.click(switchButton);
    expect(onSelectTier).toHaveBeenCalledWith("t2");
  });

  it("does not call onSelectTier when clicking current tier button", () => {
    const onSelectTier = vi.fn();
    render(
      <TiersGrid
        service={mockService}
        isSubscribed={true}
        currentTierId="t1"
        onSelectTier={onSelectTier}
      />,
    );

    const currentPlanButton = screen.getByText("Current Plan");
    fireEvent.click(currentPlanButton);
    expect(onSelectTier).not.toHaveBeenCalled();
  });

  it("renders correct button text based on subscription status", () => {
    render(
      <TiersGrid
        service={mockService}
        isSubscribed={false}
        currentTierId={null}
        onSelectTier={() => {}}
      />,
    );

    expect(screen.getAllByText("Subscribe").length).toBe(mockTiers.length);

    render(
      <TiersGrid
        service={mockService}
        isSubscribed={true}
        currentTierId="t1"
        onSelectTier={() => {}}
      />,
    );

    expect(screen.getByText("Current Plan")).toBeInTheDocument();
    expect(screen.getAllByText("Switch to This Plan").length).toBe(
      mockTiers.length - 1,
    );
  });

  it("applies correct styling to tier cards", () => {
    render(
      <TiersGrid
        service={mockService}
        isSubscribed={true}
        currentTierId="t1"
        onSelectTier={() => {}}
      />,
    );

    const basicHeading = screen.getByText("Basic");
    const currentTierCard = basicHeading.closest('div[class*="flex"]');

    if (!currentTierCard) {
      throw new Error("Basic tier card not found");
    }

    expect(currentTierCard).toHaveClass("opacity-70");
    expect(currentTierCard).toHaveClass("pointer-events-none");
    expect(currentTierCard).toHaveClass("bg-gray-200");

    const proHeading = screen.getByText("Pro");
    const otherTierCard = proHeading.closest('div[class*="flex"]');

    if (!otherTierCard) {
      throw new Error("Pro tier card not found");
    }

    expect(otherTierCard).not.toHaveClass("opacity-70");
    expect(otherTierCard).not.toHaveClass("pointer-events-none");
    expect(otherTierCard).not.toHaveClass("bg-gray-200");
  });
});
