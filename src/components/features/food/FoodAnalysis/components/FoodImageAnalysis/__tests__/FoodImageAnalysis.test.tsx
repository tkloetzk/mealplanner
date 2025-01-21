// src/components/features/food/FoodAnalysis/components/FoodImageAnalysis/__tests__/FoodImageAnalysis.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FoodImageAnalysis } from "../FoodImageAnalysis";

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
      <div data-testid="mock-image-capture">
        <button onClick={() => onCapture("test-image-data")}>Capture</button>
        <button onClick={onClose}>Close</button>
      </div>
    ),
  };
});

// Mock fetch
global.fetch = jest.fn();

describe("FoodImageAnalysis Component", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("renders take photo button initially", () => {
    render(<FoodImageAnalysis />);

    const takePhotoButton = screen.getByText(/Take Photo/i);
    expect(takePhotoButton).toBeInTheDocument();
  });

  it("opens image capture when take photo is clicked", () => {
    render(<FoodImageAnalysis />);

    const takePhotoButton = screen.getByText(/Take Photo/i);
    fireEvent.click(takePhotoButton);

    const imageCaptureModal = screen.getByTestId("mock-image-capture");
    expect(imageCaptureModal).toBeInTheDocument();
  });

  it("shows captured image after photo is taken", () => {
    render(<FoodImageAnalysis />);

    const takePhotoButton = screen.getByText(/Take Photo/i);
    fireEvent.click(takePhotoButton);

    const captureButton = screen.getByText("Capture");
    fireEvent.click(captureButton);

    const analyzeButton = screen.getByText(/Analyze Food/i);
    expect(analyzeButton).toBeInTheDocument();

    const capturedImage = screen.getByAltText("Captured food");
    expect(capturedImage).toBeInTheDocument();
  });

  it("calls onAnalysisComplete when image is successfully analyzed", async () => {
    const mockOnAnalysisComplete = jest.fn();
    const mockAnalysisResponse = {
      foods: [
        {
          name: "Test Food",
          description: "A test food item",
          portionSize: "1 serving",
          visualCharacteristics: "Green and round",
          nutritionalAnalysis: "Nutritious",
          suggestions: "Eat more",
          concerns: "None",
        },
      ],
      summary: "A test summary",
    };

    // Mock successful fetch response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAnalysisResponse),
    });

    render(<FoodImageAnalysis onAnalysisComplete={mockOnAnalysisComplete} />);

    // Take a photo
    const takePhotoButton = screen.getByText(/Take Photo/i);
    fireEvent.click(takePhotoButton);
    const captureButton = screen.getByText("Capture");
    fireEvent.click(captureButton);

    // Analyze the photo
    const analyzeButton = screen.getByText(/Analyze Food/i);
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/analyze-food-image",
        expect.any(Object)
      );
      expect(mockOnAnalysisComplete).toHaveBeenCalledWith(mockAnalysisResponse);
    });
  });

  it("handles analysis error gracefully", async () => {
    // Mock fetch to return an error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Analysis failed"));

    render(<FoodImageAnalysis />);

    // Take a photo
    const takePhotoButton = screen.getByText(/Take Photo/i);
    fireEvent.click(takePhotoButton);
    const captureButton = screen.getByText("Capture");
    fireEvent.click(captureButton);

    // Analyze the photo
    const analyzeButton = screen.getByText(/Analyze Food/i);
    fireEvent.click(analyzeButton);

    // Wait for error to be displayed
    await waitFor(() => {
      const errorMessage = screen.getByText(
        /Sorry, I couldn't analyze this image/i
      );
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it("disables buttons during analysis", async () => {
    // Create a promise that resolves slowly to simulate analysis time
    const slowAnalysisPromise = new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                foods: [],
                summary: "",
              }),
          }),
        1000
      )
    );

    (fetch as jest.Mock).mockResolvedValueOnce(slowAnalysisPromise);

    render(<FoodImageAnalysis />);

    // Take a photo
    const takePhotoButton = screen.getByText(/Take Photo/i);
    fireEvent.click(takePhotoButton);
    const captureButton = screen.getByText("Capture");
    fireEvent.click(captureButton);

    // Analyze the photo
    const analyzeButton = screen.getByText(/Analyze Food/i);
    fireEvent.click(analyzeButton);

    // Verify analyze button is disabled and shows loading state
    expect(analyzeButton).toBeDisabled();
    expect(screen.getByText(/Analyzing.../i)).toBeInTheDocument();
  });
});
