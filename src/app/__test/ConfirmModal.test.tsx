import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfirmModal from "~/components/billing/ConfirmDialog";

describe("ConfirmModal", () => {
  const defaultProps = {
    open: true,
    title: "Confirm Action",
    description: "Are you sure you want to proceed?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    onOpenChange: vi.fn(),
    confirmDisabled: false,
    cancelDisabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to proceed?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("renders with custom title and description", () => {
    const customProps = {
      ...defaultProps,
      title: "Custom Title",
      description: "Custom description text",
    };
    render(<ConfirmModal {...customProps} />);

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom description text")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<ConfirmModal {...defaultProps} open={false} />);

    expect(screen.queryByText("Confirm Action")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
  });

  it("calls onConfirm when Confirm button is clicked", async () => {
    render(<ConfirmModal {...defaultProps} />);

    const confirmButton = screen.getByRole("button", { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    render(<ConfirmModal {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(defaultProps.onCancel).toHaveBeenCalled();
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  it("does not call onCancel when dialog is closed via backdrop click", async () => {
    render(<ConfirmModal {...defaultProps} />);

    const backdrop = document.querySelector(
      ".fixed.inset-0.z-50.bg-black\\/80[data-state='open']",
    );
    if (!backdrop) {
      throw new Error("Backdrop element not found");
    }

    fireEvent.mouseDown(backdrop);
    fireEvent.click(backdrop);

    await waitFor(
      () => {
        expect(defaultProps.onCancel).not.toHaveBeenCalled();
        expect(defaultProps.onConfirm).not.toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
  });

  it("has correct accessibility attributes", () => {
    render(<ConfirmModal {...defaultProps} />);

    const modal = screen.getByRole("alertdialog");
    expect(modal).toHaveAttribute("aria-labelledby");
    expect(modal).toHaveAttribute("aria-describedby");

    const title = screen.getByText("Confirm Action");
    const description = screen.getByText("Are you sure you want to proceed?");
    expect(title).toHaveAttribute("id", modal.getAttribute("aria-labelledby"));
    expect(description).toHaveAttribute(
      "id",
      modal.getAttribute("aria-describedby"),
    );

    const confirmButton = screen.getByRole("button", { name: /Confirm/i });
    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    expect(confirmButton).toHaveAttribute("type", "button");
    expect(cancelButton).toHaveAttribute("type", "button");
  });

  it("renders without title or description", () => {
    render(<ConfirmModal {...defaultProps} title="" description="" />);

    expect(screen.queryByText("Confirm Action")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Are you sure you want to proceed?"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });
});
