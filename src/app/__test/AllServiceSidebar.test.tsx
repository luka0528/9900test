import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AllServiceSidebar } from "~/components/service/AllServiceSidebar";
import { DefaultSideBar } from "~/components/sidebar/DefaultSideBar";
import { ChevronRight } from "lucide-react";

// Mock the DefaultSideBar component
vi.mock("~/components/sidebar/DefaultSideBar", () => ({
  DefaultSideBar: vi.fn(({ items }) => (
    <div data-testid="default-sidebar">
      {items.map((item: any, index: number) => (
        <div key={index} data-testid={`sidebar-item-${index}`}>
          <span data-testid={`title-${index}`}>{item.title}</span>
          <span data-testid={`url-${index}`}>{item.url}</span>
          {item.icon && <item.icon data-testid={`icon-${index}`} />}
        </div>
      ))}
    </div>
  )),
}));

describe("AllServiceSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<AllServiceSidebar />);
    expect(screen.getByTestId("default-sidebar")).toBeInTheDocument();
  });

  it("passes correct items prop to DefaultSideBar", () => {
    render(<AllServiceSidebar />);
    expect(DefaultSideBar).toHaveBeenCalledWith(
      {
        items: [
          {
            title: "Your Services",
            url: "/service/owned",
            icon: ChevronRight,
          },
          {
            title: "Your Subscriptions",
            url: "/service/subscriptions",
            icon: ChevronRight,
          },
        ],
      },
      {},
    );
  });

  it("renders correct number of sidebar items", () => {
    render(<AllServiceSidebar />);
    expect(screen.getAllByTestId(/sidebar-item-/)).toHaveLength(2);
  });

  it("renders correct titles for sidebar items", async () => {
    render(<AllServiceSidebar />);
    const title1 = await screen.findByText((content) =>
      content.includes("Your Services"),
    );
    const title2 = await screen.findByText((content) =>
      content.includes("Your Subscriptions"),
    );
    expect(title1).toBeInTheDocument();
    expect(title2).toBeInTheDocument();
    expect(screen.getByTestId("title-0")).toHaveTextContent("Your Services");
    expect(screen.getByTestId("title-1")).toHaveTextContent(
      "Your Subscriptions",
    );
  });

  it("renders correct URLs for sidebar items", () => {
    render(<AllServiceSidebar />);
    expect(screen.getByTestId("url-0")).toHaveTextContent("/service/owned");
    expect(screen.getByTestId("url-1")).toHaveTextContent(
      "/service/subscriptions",
    );
  });

  it("renders ChevronRight icons for both items", () => {
    render(<AllServiceSidebar />);
    expect(screen.getByTestId("icon-0")).toBeInTheDocument();
    expect(screen.getByTestId("icon-1")).toBeInTheDocument();
  });

  it("passes items with correct structure to DefaultSideBar", () => {
    render(<AllServiceSidebar />);
    const mockCalls = (DefaultSideBar as any).mock.calls[0][0].items;

    expect(mockCalls[0]).toHaveProperty("title", "Your Services");
    expect(mockCalls[0]).toHaveProperty("url", "/service/owned");
    expect(mockCalls[0]).toHaveProperty("icon");

    expect(mockCalls[1]).toHaveProperty("title", "Your Subscriptions");
    expect(mockCalls[1]).toHaveProperty("url", "/service/subscriptions");
    expect(mockCalls[1]).toHaveProperty("icon");
  });

  it("does not pass unexpected props to DefaultSideBar", () => {
    render(<AllServiceSidebar />);
    const props = (DefaultSideBar as any).mock.calls[0][0];
    expect(Object.keys(props)).toEqual(["items"]);
  });

  it("renders consistently on multiple renders", () => {
    const { rerender } = render(<AllServiceSidebar />);
    const firstRender = screen.getByTestId("default-sidebar").innerHTML;

    rerender(<AllServiceSidebar />);
    const secondRender = screen.getByTestId("default-sidebar").innerHTML;

    expect(firstRender).toEqual(secondRender);
  });
});
