// src/jest.setup.ts
import "@testing-library/jest-dom";
import { setupFetchMock } from "./__mocks__/testSetup/mocks";
import { TextEncoder, TextDecoder } from "util";

// Add TextEncoder polyfill
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add fetch API globals if needed
if (!global.Response) {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.init = init;
      this.status = init?.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
    }
    async json() {
      return JSON.parse(this.body);
    }
  };
}

// Mock BroadcastChannel
class MockBroadcastChannel {
  constructor(channel) {
    this.channel = channel;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postMessage(message) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addEventListener(type, listener) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeEventListener(type, listener) {}
  close() {}
}
global.BroadcastChannel = MockBroadcastChannel;

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;

const mockGetUserMedia = jest.fn().mockResolvedValue({
  getTracks: () => [
    {
      stop: jest.fn(),
    },
  ],
});

beforeEach(() => {
  setupFetchMock();
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
});

if (!global.structuredClone) {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

jest.mock("lucide-react", () => {
  return new Proxy(
    {},
    {
      get: () => () => null,
    }
  );
});
