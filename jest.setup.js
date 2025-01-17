// Optional: configure or register global test libraries
import "@testing-library/jest-dom";

if (!global.structuredClone) {
  global.structuredClone = (obj) => {
    // Handle special cases
    if (obj === null || typeof obj !== "object") return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) =>
        item && typeof item === "object"
          ? JSON.parse(JSON.stringify(item))
          : item
      );
    }

    // Handle objects
    return JSON.parse(JSON.stringify(obj));
  };
}
jest.mock("lucide-react", () => {
  return new Proxy(
    {},
    {
      get: () => () => null,
    }
  );
});
