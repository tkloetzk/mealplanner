// components/__tests__/FAB.test.tsx
import { render, screen, fireEvent, within } from "@testing-library/react";
import { FAB } from "../FAB";
import { Plus } from "lucide-react";

describe("FAB Component", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it("renders with circular shape and blue background", () => {
    render(<FAB icon={Plus} onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("rounded-full", "bg-blue-500");
    expect(button).toHaveClass("w-12", "h-12");
  });

  it("renders with icon only", () => {
    render(<FAB icon={Plus} onClick={mockOnClick} />);

    const icon = screen.getByTestId("fab-btn");
    expect(icon).toBeInTheDocument();

    expect(icon).toHaveClass("rounded-full", "bg-blue-500");
  });

  it("applies correct position classes", () => {
    const { rerender } = render(<FAB icon={Plus} position="top-left" />);

    let button = screen.getByRole("button");
    expect(button).toHaveClass("top-4", "left-4");

    rerender(<FAB icon={Plus} position="bottom-right" />);
    button = screen.getByRole("button");
    expect(button).toHaveClass("bottom-4", "right-4");
  });

  it("handles hover and focus states", () => {
    render(<FAB icon={Plus} onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("hover:bg-blue-600", "hover:scale-105");
    expect(button).toHaveClass("focus:ring-2", "focus:ring-blue-400");
  });

  it("handles click events", () => {
    render(<FAB icon={Plus} onClick={mockOnClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
