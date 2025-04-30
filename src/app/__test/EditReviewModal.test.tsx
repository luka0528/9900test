import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditReviewModal } from "~/components/service/reviews/EditReviewModal";
import * as React from "react";

// Mock the dependencies
vi.mock("~/components/ui/button", () => ({
  Button: ({ children, onClick, type }: any) => (
    <button onClick={onClick} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("~/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" data-open={open}>
      {open && children}
      <button onClick={() => onOpenChange(false)}>Close</button>
    </div>
  ),
  DialogContent: ({ children, className }: any) => (
    <div className={className} data-testid="dialog-content">
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: any) => (
    <p data-testid="dialog-description">{children}</p>
  ),
  DialogFooter: ({ children }: any) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

vi.mock("~/components/ui/textarea", () => ({
  Textarea: ({ placeholder, defaultValue, className, ref }: any) => (
    <textarea
      placeholder={placeholder}
      defaultValue={defaultValue}
      className={className}
      ref={ref}
      data-testid="textarea"
    />
  ),
}));

vi.mock("./StarRating", () => ({
  default: ({ selectedRating, setSelectedRating }: any) => (
    <div data-testid="star-rating">
      <button
        onClick={() => setSelectedRating(3)}
        data-testid="star-rating-button"
      >
        Set Rating to 3
      </button>
      <span data-testid="selected-rating">{selectedRating ?? 0}</span>
    </div>
  ),
}));

describe("EditReviewModal", () => {
  const defaultProps = {
    originalRating: 3,
    originalContent: "Original review content",
    isModalOpen: true,
    setModalOpen: vi.fn(),
    reviewId: "review-123",
    replyId: null,
    setUpdatedPost: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog when isModalOpen is true", () => {
    render(<EditReviewModal {...defaultProps} />);
    expect(screen.getByTestId("dialog")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
  });

  it("does not render the dialog content when isModalOpen is false", () => {
    render(<EditReviewModal {...defaultProps} isModalOpen={false} />);
    expect(screen.getByTestId("dialog")).toHaveAttribute("data-open", "false");
    expect(screen.queryByTestId("dialog-content")).not.toBeInTheDocument();
  });

  it("renders reply mode correctly without star rating", () => {
    render(
      <EditReviewModal {...defaultProps} reviewId={null} replyId="reply-123" />,
    );
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Edit reply");
    expect(screen.getByTestId("dialog-description")).toHaveTextContent(
      "Make changes to your reply here. Click save when you're done.",
    );
    expect(screen.queryByTestId("star-rating")).not.toBeInTheDocument();
    expect(screen.getByTestId("textarea")).toHaveAttribute(
      "placeholder",
      "Edit reply text (optional)",
    );
  });

  it("updates textarea content when typing", () => {
    render(<EditReviewModal {...defaultProps} />);
    const textarea = screen.getByTestId("textarea");
    fireEvent.change(textarea, { target: { value: "Updated review content" } });
    expect(textarea).toHaveValue("Updated review content");
  });

  it("calls setModalOpen when dialog is closed", () => {
    render(<EditReviewModal {...defaultProps} />);
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);
    expect(defaultProps.setModalOpen).toHaveBeenCalledWith(false);
  });

  it("initialises with null originalContent", () => {
    render(<EditReviewModal {...defaultProps} originalContent={null} />);
    expect(screen.getByTestId("textarea")).toHaveValue("");
  });

  it("handles empty textarea on submit", async () => {
    render(<EditReviewModal {...defaultProps} originalContent={null} />);
    const saveButton = screen.getByText("Save changes");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.setUpdatedPost).toHaveBeenCalledWith({
        ready: true,
        isUpdateDelete: false,
        updatedContent: "",
        updatedRating: 3,
        id: "review-123",
      });
    });
  });

  it("sets inputType to reply when reviewId is null", () => {
    render(
      <EditReviewModal {...defaultProps} reviewId={null} replyId="reply-123" />,
    );
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Edit reply");
  });

  it("sets inputType to review when reviewId is provided", () => {
    render(<EditReviewModal {...defaultProps} />);
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Edit review");
  });

  it("renders dialog with correct max-width class", () => {
    render(<EditReviewModal {...defaultProps} />);
    expect(screen.getByTestId("dialog-content")).toHaveClass(
      "sm:max-w-[425px]",
    );
  });

  it("renders textarea with correct col-span class", () => {
    render(<EditReviewModal {...defaultProps} />);
    expect(screen.getByTestId("textarea")).toHaveClass("col-span-full");
  });
});
