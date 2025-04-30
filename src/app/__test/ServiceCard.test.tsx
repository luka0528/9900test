import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ServiceCard } from "~/components/service/ServiceCard";
import { useRouter, useSearchParams } from "next/navigation";

// Mock the next/navigation hooks
const mockRouter = {
  push: vi.fn(),
};
const mockUseRouter = vi.mocked(useRouter);
const mockUseSearchParams = vi.mocked(useSearchParams);

describe("ServiceCard Component", () => {
  const mockSearchParamsToString = vi
    .fn()
    .mockReturnValue("query=test&filter=active");
  const mockSearchParams = {
    toString: mockSearchParamsToString,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
  });

  afterEach(() => {
    cleanup();
  });

  const defaultService = {
    id: "service-123",
    name: "Test Service",
    owner: "John Doe",
    tags: ["api", "test", "demo"],
    latestVersionId: "v1.0.0",
    latestVersion: "1.0.0",
  };

  test("renders service card with all required information", () => {
    render(<ServiceCard service={defaultService} />);

    expect(screen.getByText("Test Service")).toBeInTheDocument();

    expect(screen.getByText("John Doe")).toBeInTheDocument();

    expect(screen.getByText("1.0.0")).toBeInTheDocument();

    expect(screen.getByText("api")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("demo")).toBeInTheDocument();

    expect(screen.getByText("View details")).toBeInTheDocument();
  });

  test("displays 'No tags' when service has no tags", () => {
    const serviceWithNoTags = {
      ...defaultService,
      tags: [],
    };

    render(<ServiceCard service={serviceWithNoTags} />);

    expect(screen.getByText("No tags")).toBeInTheDocument();
  });

  test("navigates to service details when card is clicked", () => {
    const { container } = render(<ServiceCard service={defaultService} />);

    const card = container.querySelector(".card, .flex.h-full.flex-col")!;
    fireEvent.click(card);

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/service/service-123/v1.0.0?query=test&filter=active",
    );
    expect(mockSearchParamsToString).toHaveBeenCalled();
  });

  test("shows 'Manage Subscription' button when service is subscribed", () => {
    const subscribedService = {
      ...defaultService,
      isSubscribed: true,
    };

    render(<ServiceCard service={subscribedService} />);

    expect(
      screen.getByRole("button", { name: "Manage Subscription" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View details" }),
    ).toBeInTheDocument();
  });

  test("navigates to service purchase page when 'Manage Subscription' is clicked", () => {
    const subscribedService = {
      ...defaultService,
      isSubscribed: true,
    };

    render(<ServiceCard service={subscribedService} />);

    const manageButton = screen.getByRole("button", {
      name: "Manage Subscription",
    });
    fireEvent.click(manageButton);

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/service/service-123/purchase",
    );
  });

  test("prevents event propagation when 'Manage Subscription' is clicked", () => {
    const subscribedService = {
      ...defaultService,
      isSubscribed: true,
    };

    render(<ServiceCard service={subscribedService} />);

    // Find button and click it
    const manageButton = screen.getByRole("button", {
      name: "Manage Subscription",
    });
    fireEvent.click(manageButton);

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/service/service-123/purchase",
    );
  });

  test("displays correct UI when service is not subscribed", () => {
    const unsubscribedService = {
      ...defaultService,
      isSubscribed: false,
    };

    render(<ServiceCard service={unsubscribedService} />);

    // "Manage Subscription" shouldn't be present
    expect(
      screen.queryByRole("button", { name: "Manage Subscription" }),
    ).not.toBeInTheDocument();

    // "View details" should be present
    expect(
      screen.getByRole("button", { name: "View details" }),
    ).toBeInTheDocument();
  });

  test("renders correctly when no isSubscribed property is provided", () => {
    render(<ServiceCard service={defaultService} />);

    expect(
      screen.queryByRole("button", { name: "Manage Subscription" }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "View details" }),
    ).toBeInTheDocument();
  });

  test("navigates correctly when View details button is clicked", () => {
    render(<ServiceCard service={defaultService} />);

    const viewDetailsButton = screen.getByRole("button", {
      name: "View details",
    });
    fireEvent.click(viewDetailsButton);

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/service/service-123/v1.0.0?query=test&filter=active",
    );
  });
});
