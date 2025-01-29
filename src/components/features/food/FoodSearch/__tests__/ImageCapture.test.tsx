// components/ImageCapture.test.tsx
import React, { act } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageCapture } from "@/components/ImageCapture";

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn().mockResolvedValue({
  getTracks: () => [
    {
      stop: jest.fn(),
    },
  ],
});

describe("ImageCapture Component", () => {
  const mockOnCapture = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock MediaDevices and getUserMedia
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      configurable: true,
    });

    // Mock Video element methods
    HTMLVideoElement.prototype.play = jest.fn().mockResolvedValue(undefined);
    HTMLVideoElement.prototype.pause = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders camera initialization view", async () => {
    await act(async () => {
      render(<ImageCapture onCapture={mockOnCapture} onClose={mockOnClose} />);
    });

    expect(screen.getByText(/Take Food Photo/i)).toBeInTheDocument();
    expect(screen.getByText(/Initializing camera/i)).toBeInTheDocument();
  });

  it("handles camera access error", async () => {
    // Simulate camera access error
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: jest
          .fn()
          .mockRejectedValue(new Error("Camera access denied")),
      },
      configurable: true,
    });

    await act(async () => {
      render(<ImageCapture onCapture={mockOnCapture} onClose={mockOnClose} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Camera Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Could not access camera/i)).toBeInTheDocument();
    });
  });

  it.skip("captures image and allows retake", async () => {
    // Mock createElement and canvas methods
    const createElementSpy = jest.spyOn(document, "createElement");
    const createContextSpy = jest.fn().mockReturnValue({
      drawImage: jest.fn(),
    });

    // Setup mock canvas
    createElementSpy.mockImplementation((tagName) => {
      if (tagName === "canvas") {
        return {
          width: 640,
          height: 480,
          getContext: createContextSpy,
          toDataURL: jest.fn().mockReturnValue("mock-image-data"),
        } as unknown as HTMLCanvasElement;
      }
      return document.createElement(tagName);
    });

    // Wait for camera to initialize
    await waitFor(() => {
      const takePhotoButton = screen.getByText(/Take Photo/i);
      expect(takePhotoButton).toBeEnabled();
    });

    // Capture image
    await act(async () => {
      const takePhotoButton = screen.getByText(/Take Photo/i);
      fireEvent.click(takePhotoButton);
    });

    // Verify captured image view is present
    await waitFor(() => {
      const usePhotoButton = screen.getByText(/Use Photo/i);
      const retakeButton = screen.getByText(/Retake/i);

      expect(usePhotoButton).toBeInTheDocument();
      expect(retakeButton).toBeInTheDocument();
    });

    // Click retake
    await act(async () => {
      const retakeButton = screen.getByText(/Retake/i);
      fireEvent.click(retakeButton);
    });

    // Verify returned to camera view
    await waitFor(() => {
      const takePhotoButton = screen.getByText(/Take Photo/i);
      expect(takePhotoButton).toBeInTheDocument();
    });

    // Clean up spies
    createElementSpy.mockRestore();
  });

  it.skip("handles image capture and confirmation", async () => {
    await act(async () => {
      render(<ImageCapture onCapture={mockOnCapture} onClose={mockOnClose} />);
    });

    // Simulate image capture
    await act(async () => {
      const captureButton = screen.getByText(/Take Photo/i);
      fireEvent.click(captureButton);
    });

    // Confirm captured image
    await act(async () => {
      const usePhotoButton = screen.getByText(/Use Photo/i);
      fireEvent.click(usePhotoButton);
    });

    // Verify onCapture was called
    expect(mockOnCapture).toHaveBeenCalledWith(expect.any(String));
  });

  it.skip("closes the image capture", async () => {
    await act(async () => {
      render(<ImageCapture onCapture={mockOnCapture} onClose={mockOnClose} />);
    });

    // Close button
    await act(async () => {
      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
});
