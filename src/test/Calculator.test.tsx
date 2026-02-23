import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Calculator from "../Calculator";

// ---------- helpers ----------

function getDisplay() {
  return screen.getByTestId("display");
}

function press(label: string) {
  fireEvent.click(screen.getByTestId(`btn-${label}`));
}

// ---------- mock fetch ----------

function mockFetch(result: number) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ result }),
  });
}

function mockFetchError(message: string) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ error: message }),
  });
}

// ---------- tests ----------

describe("Calculator", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with initial display of 0", () => {
    render(<Calculator />);
    expect(getDisplay()).toHaveTextContent("0");
  });

  it("enters digits correctly", () => {
    render(<Calculator />);
    press("1");
    press("2");
    press("3");
    expect(getDisplay()).toHaveTextContent("123");
  });

  it("replaces leading zero with first digit", () => {
    render(<Calculator />);
    press("5");
    expect(getDisplay()).toHaveTextContent("5");
  });

  it("adds a decimal point", () => {
    render(<Calculator />);
    press("3");
    press(".");
    press("1");
    expect(getDisplay()).toHaveTextContent("3.1");
  });

  it("prevents multiple decimal points", () => {
    render(<Calculator />);
    press("1");
    press(".");
    press(".");
    press("2");
    expect(getDisplay()).toHaveTextContent("1.2");
  });

  it("clears with AC", () => {
    render(<Calculator />);
    press("9");
    press("9");
    press("AC");
    expect(getDisplay()).toHaveTextContent("0");
  });

  it("toggles sign with +/−", () => {
    render(<Calculator />);
    press("7");
    press("+/−");
    expect(getDisplay()).toHaveTextContent("-7");
  });

  it("calculates percentage", () => {
    render(<Calculator />);
    press("5");
    press("0");
    press("%");
    expect(getDisplay()).toHaveTextContent("0.5");
  });

  it("performs addition via the backend", async () => {
    mockFetch(8);
    render(<Calculator />);

    press("5");
    press("+");
    press("3");
    press("=");

    await waitFor(() => {
      expect(getDisplay()).toHaveTextContent("8");
    });

    expect(global.fetch).toHaveBeenCalledWith("/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operand1: 5, operand2: 3, operator: "+" }),
    });
  });

  it("performs division via the backend", async () => {
    mockFetch(5);
    render(<Calculator />);

    press("1");
    press("0");
    press("÷");
    press("2");
    press("=");

    await waitFor(() => {
      expect(getDisplay()).toHaveTextContent("5");
    });
  });

  it("shows error for divide by zero", async () => {
    mockFetchError("Cannot divide by zero");
    render(<Calculator />);

    press("5");
    press("÷");
    press("0");
    press("=");

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Cannot divide by zero"
      );
    });
  });

  it("chains operations: 3 + 4 × 2 =", async () => {
    // 3 + 4 should first resolve to 7
    mockFetch(7);
    render(<Calculator />);

    press("3");
    press("+");
    press("4");
    press("×"); // should trigger 3 + 4 first

    await waitFor(() => {
      expect(getDisplay()).toHaveTextContent("7");
    });

    // Now 7 × something — enter 2
    mockFetch(14);
    press("2");
    press("=");

    await waitFor(() => {
      expect(getDisplay()).toHaveTextContent("14");
    });
  });

  it("limits input to MAX_DISPLAY_LENGTH digits", () => {
    render(<Calculator />);
    // Type 17 digits — only first 16 should register
    for (let i = 0; i < 17; i++) {
      press("1");
    }
    expect(getDisplay().textContent!.length).toBeLessThanOrEqual(16);
  });

  it("handles decimal after operator correctly", () => {
    render(<Calculator />);
    press("5");
    press("+");
    press(".");
    press("3");
    expect(getDisplay()).toHaveTextContent("0.3");
  });
});
