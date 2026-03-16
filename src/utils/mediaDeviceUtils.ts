// Media device detection and error handling utilities

/**
 * Detects if the current device is running iOS
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /iPhone|iPad|iPod/i.test(userAgent);
}

/**
 * Detects if the current browser is Safari
 */
export function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent);
}

/**
 * Detects if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Checks if media devices API is supported
 */
export function hasMediaDeviceSupport(): boolean {
  return !!(
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

/**
 * Gets an error message with suggested action based on error type and platform
 */
export function getMediaErrorMessage(error: unknown): {
  message: string;
  code: string;
  suggestedAction: string;
} {
  const iOS = isIOSDevice();
  const errorMessage =
    error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : "";

  // Permission denied errors
  if (
    errorMessage.includes("NotAllowedError") ||
    errorName === "NotAllowedError"
  ) {
    return {
      message: "Camera access denied",
      code: "NotAllowedError",
      suggestedAction: iOS
        ? "On iPhone, go to Settings > [Your Browser] > Camera and enable camera access. Then refresh and try again."
        : "Please allow camera access when prompted by your browser. Check your browser's site settings if you previously denied access.",
    };
  }

  // Camera not found errors
  if (
    errorMessage.includes("NotFoundError") ||
    errorName === "NotFoundError"
  ) {
    return {
      message: "No camera found on this device",
      code: "NotFoundError",
      suggestedAction:
        "Please try this feature on a device with a camera, or ensure your camera is properly connected.",
    };
  }

  // Not supported errors
  if (
    errorMessage.includes("NotSupportedError") ||
    errorName === "NotSupportedError" ||
    errorMessage.includes("not supported")
  ) {
    // Detect connection context
    const protocol =
      typeof window !== "undefined" ? window.location.protocol : "unknown:";
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "unknown";
    const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);

    let suggestedAction =
      "Camera access requires a secure connection (HTTPS) or localhost.";

    if (iOS && protocol === "http:" && isIP) {
      // Specific guidance for iOS + HTTP + IP address (cross-device scenario)
      suggestedAction = `You're accessing via ${protocol}//${hostname}. On iOS, camera requires HTTPS. Quick solutions:

1. Quick setup: Use ngrok for instant HTTPS tunnel
   Run: npx ngrok http 3000
   Then access the https://xxx.ngrok.io URL on your iPhone

2. Better for dev: Set up HTTPS dev server
   - Generate self-signed certificate
   - Configure Next.js/dev server for HTTPS
   - Trust certificate on iPhone (Settings > General > About > Certificate Trust)

Note: The "localhost" exception doesn't help when accessing from a different device.`;
    } else if (iOS && protocol === "http:") {
      suggestedAction =
        "On iOS, camera requires HTTPS. You're using HTTP which is not secure enough for camera access.";
    } else if (iOS) {
      suggestedAction =
        "Camera access requires a secure connection. On iOS, use HTTPS.";
    }

    return {
      message: "Camera requires secure connection",
      code: "NotSupportedError",
      suggestedAction,
    };
  }

  // Security errors (often HTTPS-related)
  if (
    errorMessage.includes("SecurityError") ||
    errorName === "SecurityError"
  ) {
    return {
      message: "Camera access blocked by security policy",
      code: "SecurityError",
      suggestedAction:
        "Camera access requires a secure connection. Please use HTTPS or localhost.",
    };
  }

  // Generic error
  return {
    message: errorMessage || "Could not access camera",
    code: "UnknownError",
    suggestedAction:
      "Please check your camera permissions and try again. Ensure your camera is not being used by another application.",
  };
}

/**
 * Gets optimal media constraints based on device type
 */
export function getOptimalMediaConstraints(): MediaStreamConstraints[] {
  const iOS = isIOSDevice();
  const mobile = isMobileDevice();

  if (iOS || mobile) {
    // For mobile devices, start with simpler constraints
    return [
      {
        video: {
          facingMode: "environment", // Rear camera preferred
        },
      },
      { video: true }, // Fallback to any camera
    ];
  }

  // For desktop, can request higher quality
  return [
    {
      video: {
        facingMode: "environment",
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
      },
    },
    { video: true }, // Fallback
  ];
}
