// src/jest.setup.ts
import "@testing-library/jest-dom";
import {
  setupFetchMock,
  setupLocalStorageMock,
} from "./__mocks__/testSetup/mocks";

const mockGetUserMedia = jest.fn().mockResolvedValue({
  getTracks: () => [
    {
      stop: jest.fn(),
    },
  ],
});

beforeEach(() => {
  setupFetchMock();
  setupLocalStorageMock();
  // Reset date mock to Sunday (index 0)
  jest.spyOn(Date.prototype, "getDay").mockReturnValue(0);

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
  jest.clearAllMocks();
  jest.restoreAllMocks();
  localStorage.clear();
});

if (!global.structuredClone) {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

jest.mock("lucide-react", () => {
  return new Proxy(
    {},
    {
      get: () => () => null,
    }
  );
});
