// components/ImageCapture.test.tsx
import React, { act } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageCapture } from "@/components/ImageCapture";

// Mock media device utilities
jest.mock("@/utils/mediaDeviceUtils", () => ({
  hasMediaDeviceSupport: jest.fn(() => true),
  isIOSDevice: jest.fn(() => false),
  isSafari: jest.fn(() => false),
  isMobileDevice: jest.fn(() => false),
  getMediaErrorMessage: jest.fn((error) => {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Match behavior of actual utility
    if (errorMessage.includes("access denied")) {
      return {
        message: "Camera access denied",
        code: "NotAllowedError",
        suggestedAction:
          "Please check your camera permissions and try again.",
      };
    }

    return {
      message: errorMessage || "Could not access camera",
      code: "UnknownError",
      suggestedAction:
        "Please check your camera permissions and try again.",
    };
  }),
  getOptimalMediaConstraints: jest.fn(() => [
    {
      video: {
        facingMode: "environment",
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
      },
    },
    { video: true },
  ]),
}));

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

  it("renders idle state with Start Camera button initially", async () => {
    render(<ImageCapture onCapture={mockOnCapture} onClose={mockOnClose} />);

    // Should show idle state, not auto-initialize
    expect(screen.getByText(/Take Food Photo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We'll need access to your camera/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Start Camera/i)).toBeInTheDocument();

    // Camera should NOT be initialized yet
    expect(mockGetUserMedia).not.toHaveBeenCalled();
  });

  it("initializes camera when Start Camera button is clicked", async () => {
    render(<ImageCapture onCapture={mockOnCapture} onClose={mockOnClose} />);

    // Click Start Camera button
    const startButton = screen.getByText(/Start Camera/i);
    await act(async () => {
      fireEvent.click(startButton);
    });

    // Should show initializing state
    await waitFor(() => {
      expect(screen.getByText(/Initializing camera/i)).toBeInTheDocument();
    });

    // Camera should be initialized from user gesture
    expect(mockGetUserMedia).toHaveBeenCalled();
  });

  it("handles camera access error with suggested action", async () => {
    // Simulate camera access error
    const mockError = new Error("Camera access denied");
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: jest.fn().mockRejectedValue(mockError),
      },
      configurable: true,
    });

    render(<ImageCapture onCapture={mockOnCapture} onClose={mockOnClose} />);

    // Click Start Camera to trigger initialization
    const startButton = screen.getByText(/Start Camera/i);
    await act(async () => {
      fireEvent.click(startButton);
    });

    // Should show error with suggested action
    await waitFor(() => {
      expect(screen.getByText(/Camera Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Camera access denied/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Please check your camera permissions/i)
      ).toBeInTheDocument();
    });

    // Should show Retry button
    expect(screen.getByText(/Retry/i)).toBeInTheDocument();
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
