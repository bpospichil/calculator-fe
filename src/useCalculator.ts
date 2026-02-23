import { useCallback, useRef, useState } from "react";
import { calculate } from "./api";

export interface CalculatorState {
  display: string;
  previousOperand: string;
  operator: string | null;
  waitingForOperand: boolean;
  loading: boolean;
  error: string | null;
}

const MAX_DISPLAY_LENGTH = 16;

const initialState: CalculatorState = {
  display: "0",
  previousOperand: "",
  operator: null,
  waitingForOperand: false,
  loading: false,
  error: null,
};

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(initialState);
  const stateRef = useRef(state);

  const set = useCallback(
    (updater: CalculatorState | ((prev: CalculatorState) => CalculatorState)) => {
      setState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        stateRef.current = next;
        return next;
      });
    },
    []
  );

  const inputDigit = useCallback(
    (digit: string) => {
      set((prev) => {
        if (prev.loading) return prev;

        if (
          !prev.waitingForOperand &&
          prev.display.replace(/[^0-9]/g, "").length >= MAX_DISPLAY_LENGTH
        ) {
          return prev;
        }

        if (prev.waitingForOperand) {
          return { ...prev, display: digit, waitingForOperand: false, error: null };
        }

        return {
          ...prev,
          display: prev.display === "0" ? digit : prev.display + digit,
          error: null,
        };
      });
    },
    [set]
  );

  const inputDecimal = useCallback(() => {
    set((prev) => {
      if (prev.loading) return prev;

      if (prev.waitingForOperand) {
        return { ...prev, display: "0.", waitingForOperand: false, error: null };
      }

      if (prev.display.includes(".")) return prev;

      return { ...prev, display: prev.display + ".", error: null };
    });
  }, [set]);

  const clear = useCallback(() => {
    set(initialState);
  }, [set]);

  const toggleSign = useCallback(() => {
    set((prev) => {
      if (prev.loading) return prev;
      const value = parseFloat(prev.display);
      if (value === 0) return prev;
      return { ...prev, display: String(-value), error: null };
    });
  }, [set]);

  const inputPercent = useCallback(() => {
    set((prev) => {
      if (prev.loading) return prev;
      const value = parseFloat(prev.display);
      return { ...prev, display: String(value / 100), error: null };
    });
  }, [set]);

  const performOperation = useCallback(
    async (nextOperator: string) => {
      const current = stateRef.current;
      if (current.loading) return;

      const inputValue = current.display;

      // No previous operator — store operand and operator (ignore "=" with nothing pending)
      if (current.operator === null) {
        if (nextOperator === "=") return;
        set({
          ...current,
          previousOperand: inputValue,
          operator: nextOperator,
          waitingForOperand: true,
          error: null,
        });
        return;
      }

      // "=" triggers the pending operation; other operators chain
      if (nextOperator !== "=" && current.waitingForOperand) {
        // Just swap the operator if user hasn't entered a new operand yet
        set({ ...current, operator: nextOperator });
        return;
      }

      // We have a pending operation — call the backend
      const operand1 = parseFloat(current.previousOperand);
      const operand2 = parseFloat(inputValue);

      set({ ...current, loading: true, error: null });

      try {
        const response = await calculate({
          a: operand1,
          b: operand2,
          operation: current.operator,
        });

        const resultStr = formatResult(response.result);

        set({
          ...stateRef.current,
          display: resultStr,
          previousOperand: resultStr,
          operator: nextOperator === "=" ? null : nextOperator,
          waitingForOperand: true,
          loading: false,
          error: null,
        });
      } catch (err) {
        set({
          ...stateRef.current,
          loading: false,
          error: err instanceof Error ? err.message : "Calculation failed",
        });
      }
    },
    [set]
  );

  return {
    state,
    inputDigit,
    inputDecimal,
    clear,
    toggleSign,
    inputPercent,
    performOperation,
  };
}

function formatResult(value: number): string {
  const str = String(value);
  if (str.length > MAX_DISPLAY_LENGTH) {
    return value.toExponential(MAX_DISPLAY_LENGTH - 6);
  }
  return str;
}
