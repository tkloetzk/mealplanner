// ImageUploader.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageUploader } from "@/components/FoodEditor/ImageUploader";
//import { ImageCapture } from "@/components/ImageCapture";
// Mock dependencies
jest.mock("@/utils/imageUtils", () => ({
  getFoodImageSource: jest.fn(() => null),
  isValidUrl: jest.fn((url) => url !== null && url !== undefined && url !== ""),
}));

// Mock the ImageCapture component
jest.mock("@/components/ImageCapture", () => {
  return {
    ImageCapture: ({
      onCapture,
      onClose,
    }: {
      onCapture: (image: string) => void;
      onClose: () => void;
    }) => (
      <div data-testid="image-capture-mock">
        <button onClick={() => onCapture("test-image-data")}>Capture</button>
        <button onClick={onClose}>Close</button>
      </div>
    ),
  };
});

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

describe("ImageUploader Component", () => {
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders take photo button when no image", () => {
    render(<ImageUploader onUpload={mockOnUpload} />);

    const takePhotoButton = screen.getByText(/Take Photo/i);
    expect(takePhotoButton).toBeInTheDocument();
  });

  it("opens image capture when take photo is clicked", () => {
    render(<ImageUploader onUpload={mockOnUpload} />);

    const takePhotoButton = screen.getByText(/Take Photo/i);
    fireEvent.click(takePhotoButton);

    // Use data-testid instead of text
    const imageCaptureModal = screen.getByTestId("image-capture-mock");
    expect(imageCaptureModal).toBeInTheDocument();
  });

  it("handles image capture and upload flow", async () => {
    render(<ImageUploader onUpload={mockOnUpload} />);

    // Click take photo button
    const takePhotoButton = screen.getByText(/Take Photo/i);
    fireEvent.click(takePhotoButton);

    // Find and click the mock capture button
    const captureButton = screen.getByText("Capture");
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith("test-image-data");
    });
  });

  it("displays existing image when provided", () => {
    const existingImageUrl = "https://example.com/existing-image.jpg";
    render(
      <ImageUploader onUpload={mockOnUpload} imageUrl={existingImageUrl} />
    );

    const image = screen.getByRole("img");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", existingImageUrl);
  });
});
