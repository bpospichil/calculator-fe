import { useCalculator } from "./useCalculator";

const BUTTON_ROWS = [
  [
    { label: "AC", type: "function" as const, wide: true },
    { label: "+/−", type: "function" as const },
    { label: "÷", type: "operator" as const },
  ],
  [
    { label: "7", type: "digit" as const },
    { label: "8", type: "digit" as const },
    { label: "9", type: "digit" as const },
    { label: "×", type: "operator" as const },
  ],
  [
    { label: "4", type: "digit" as const },
    { label: "5", type: "digit" as const },
    { label: "6", type: "digit" as const },
    { label: "−", type: "operator" as const },
  ],
  [
    { label: "1", type: "digit" as const },
    { label: "2", type: "digit" as const },
    { label: "3", type: "digit" as const },
    { label: "+", type: "operator" as const },
  ],
  [
    { label: "0", type: "digit" as const, wide: true },
    { label: ".", type: "digit" as const },
    { label: "=", type: "operator" as const },
  ],
];

const OPERATOR_MAP: Record<string, string> = {
  "÷": "divide",
  "×": "multiply",
  "−": "subtract",
  "+": "add",
  "=": "=",
};

const ARIA_LABEL_MAP: Record<string, string> = {
  "÷": "divide",
  "×": "multiply",
  "−": "subtract",
  "+": "add",
  "=": "equals",
  "+/−": "toggle sign",
  "%": "percent",
  AC: "all clear",
};

export default function Calculator() {
  const {
    state,
    inputDigit,
    inputDecimal,
    clear,
    toggleSign,
    performOperation,
  } = useCalculator();

  const handleButton = (label: string, type: string) => {
    switch (type) {
      case "digit":
        if (label === ".") inputDecimal();
        else inputDigit(label);
        break;
      case "operator":
        performOperation(OPERATOR_MAP[label] || label);
        break;
      case "function":
        if (label === "AC") clear();
        else if (label === "+/−") toggleSign();
        break;
    }
  };

  return (
    <div
      className="w-[90vw] max-w-[20rem] sm:max-w-[24rem] md:max-w-[28rem] lg:max-w-[32rem] mx-auto select-none"
      data-testid="calculator"
    >
      {/* Shell */}
      <div className="bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* macOS window dots */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>

        {/* Display — fixed height, text auto-shrinks via CSS so layout never shifts */}
        <div className="px-5 pt-4 pb-2 h-[5.5rem] sm:h-[6.5rem] md:h-[7.5rem] flex flex-col justify-end items-end overflow-hidden">
          {state.error && (
            <p
              className="text-red-400 text-xs sm:text-sm mb-1 truncate w-full text-right"
              data-testid="error"
              role="alert"
            >
              {state.error}
            </p>
          )}
          <span
            className={`calc-display text-white font-light tracking-tight text-right w-full leading-none ${
              state.loading ? "opacity-50 animate-pulse" : ""
            }`}
            data-testid="display"
            aria-live="polite"
            role="status"
          >
            {state.display}
          </span>
        </div>

        {/* Buttons */}
        <div className="grid gap-[1px] p-2">
          {BUTTON_ROWS.map((row, ri) => (
            <div key={ri} className="grid grid-cols-4 gap-[1px]">
              {row.map((btn) => {
                const isOperator = btn.type === "operator";
                const isFunction = btn.type === "function";
                const isWide = "wide" in btn && btn.wide;

                return (
                  <button
                    key={btn.label}
                    data-testid={`btn-${btn.label}`}
                    aria-label={ARIA_LABEL_MAP[btn.label] ?? btn.label}
                    onClick={() => handleButton(btn.label, btn.type)}
                    disabled={state.loading}
                    className={[
                      "flex items-center justify-center rounded-full font-medium",
                      "text-lg sm:text-xl md:text-2xl",
                      "h-14 sm:h-16 md:h-[4.5rem] lg:h-20",
                      "transition-colors active:brightness-125 disabled:opacity-50",
                      isWide ? "col-span-2 px-6 justify-start" : "",
                      isOperator
                        ? "bg-orange-500 text-white hover:bg-orange-400"
                        : isFunction
                          ? "bg-neutral-600 text-white hover:bg-neutral-500"
                          : "bg-neutral-700 text-white hover:bg-neutral-600",
                    ].join(" ")}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
