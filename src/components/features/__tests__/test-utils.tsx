import React from "react";
import { render as rtlRender } from "@testing-library/react";

function render(ui: React.ReactElement) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <div className="test-wrapper">{children}</div>;
  }

  return rtlRender(ui, { wrapper: Wrapper });
}

export * from "@testing-library/react";
export { render };
