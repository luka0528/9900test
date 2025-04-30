import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChangelogPoint } from "~/components/service/changelog/ChangelogPoint";
import { ChangeLogPointType } from "@prisma/client";

// Mock data for testing
const mockChangelogPoint = {
  id: "1",
  versionId: "v1",
  createdAt: new Date(),
  description: "Test description",
  type: ChangeLogPointType.ADDED,
};

// Map of ChangeLogPointType to expected Tailwind classes
const variantClassMap = {
  [ChangeLogPointType.ADDED]: "bg-green-500 text-white",
  [ChangeLogPointType.CHANGED]: "bg-blue-500 text-white",
  [ChangeLogPointType.DEPRECATED]: "bg-yellow-500 text-white",
  [ChangeLogPointType.REMOVED]: "bg-red-500 text-white",
  [ChangeLogPointType.FIXED]: "bg-purple-500 text-white",
  [ChangeLogPointType.SECURITY]: "bg-orange-500 text-white",
};

describe("ChangelogPoint", () => {
  // Test rendering for each ChangeLogPointType
  Object.values(ChangeLogPointType).forEach((type) => {
    it(`renders correctly with ${type} type`, () => {
      render(
        <ChangelogPoint changelogPoint={{ ...mockChangelogPoint, type }} />,
      );

      const badge = screen.getByText(type);
      expect(badge).toBeInTheDocument();

      const description = screen.getByText("Test description");
      expect(description).toBeInTheDocument();

      expect(badge).toHaveClass(...variantClassMap[type].split(" "));
    });
  });

  it("renders description with muted foreground class", () => {
    render(<ChangelogPoint changelogPoint={mockChangelogPoint} />);

    const description = screen.getByText("Test description");
    expect(description).toHaveClass("text-muted-foreground");
  });

  it("renders with correct container layout", () => {
    render(<ChangelogPoint changelogPoint={mockChangelogPoint} />);

    const container = screen.getByText("Test description").parentElement;
    expect(container).toHaveClass("flex", "gap-2");
  });

  // Test edge cases
  it("handles empty description", () => {
    render(
      <ChangelogPoint
        changelogPoint={{ ...mockChangelogPoint, description: "" }}
      />,
    );

    const description = document.querySelector("p.text-muted-foreground");
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent("");
    expect(description).toHaveClass("text-muted-foreground");
  });

  it("renders badge with correct variant for each type", () => {
    Object.entries(variantClassMap).forEach(([type, classes]) => {
      render(
        <ChangelogPoint
          changelogPoint={{
            ...mockChangelogPoint,
            type: type as ChangeLogPointType,
          }}
        />,
      );

      const badge = screen.getByText(type);
      expect(badge).toHaveClass(...classes.split(" "));
    });
  });
});
