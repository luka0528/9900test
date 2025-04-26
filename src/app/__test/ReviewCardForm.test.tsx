import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReviewCardForm } from "~/components/service/reviews/ReviewCardForm";
import { toast } from "sonner";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("./StarRating", () => ({
  default: ({ setSelectedRating, setHoveredRating }: any) => (
    <div data-testid="star-rating">
      <button
        onClick={() => {
          setSelectedRating(3);
          setHoveredRating(3);
        }}
        data-testid="star-button"
      >
        Rate 3 Stars
      </button>
    </div>
  ),
}));

describe("ReviewCardForm", () => {
  const mockSetNewCardData = vi.fn();
  const mockSetTopButton = vi.fn();
  const defaultProps = {
    reviewerName: "John Doe",
    setNewCardData: mockSetNewCardData,
    setTopButton: mockSetTopButton,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders reviewer name correctly", () => {
    render(<ReviewCardForm {...defaultProps} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders avatar fallback with first letter of reviewer name", () => {
    render(<ReviewCardForm {...defaultProps} />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders textarea with correct placeholder", () => {
    render(<ReviewCardForm {...defaultProps} />);
    const textarea = screen.getByPlaceholderText("Insert review (optional)");
    expect(textarea).toBeInTheDocument();
  });

  it("renders cancel button with X icon", () => {
    render(<ReviewCardForm {...defaultProps} />);
    const cancelButton = screen.getByRole("button", { name: "" });
    expect(cancelButton).toBeInTheDocument();
  });

  it("renders post button with Send icon", () => {
    render(<ReviewCardForm {...defaultProps} />);
    const postButton = screen.getByRole("button", { name: /Post/i });
    expect(postButton).toBeInTheDocument();
  });

  it("calls setNewCardData with correct values when cancel button is clicked", () => {
    render(<ReviewCardForm {...defaultProps} />);
    const cancelButton = screen.getByRole("button", { name: "" });
    fireEvent.click(cancelButton);
    expect(mockSetNewCardData).toHaveBeenCalledWith({
      isVisible: false,
      starValue: null,
      content: null,
    });
  });

  it("shows error toast when post button is clicked without rating", () => {
    render(<ReviewCardForm {...defaultProps} />);
    const postButton = screen.getByRole("button", { name: /Post/i });
    fireEvent.click(postButton);
    expect(toast.error).toHaveBeenCalledWith("You must give a rating");
    expect(mockSetNewCardData).not.toHaveBeenCalled();
    expect(mockSetTopButton).not.toHaveBeenCalled();
  });
});
