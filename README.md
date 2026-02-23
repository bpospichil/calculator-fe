# Calculator App — React + TypeScript + Vite

A macOS-style calculator single-page application built with **React 18**, **TypeScript**, and **Vite**. The UI delegates all arithmetic to a Go backend API via `POST /calculate`, making the frontend a pure presentation and state-management layer.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       Browser                            │
│                                                          │
│  ┌──────────────┐    ┌───────────────┐    ┌───────────┐  │
│  │ Calculator.tsx│───▶│useCalculator.ts│───▶│  api.ts   │  │
│  │  (UI layer)  │    │ (state hook)  │    │ (fetch)   │  │
│  └──────────────┘    └───────────────┘    └─────┬─────┘  │
│                                                 │        │
└─────────────────────────────────────────────────┼────────┘
                                                  │
                                         POST /calculate
                                                  │
                                          ┌───────▼───────┐
                                          │  Go Backend   │
                                          │  :8080        │
                                          └───────────────┘
```

### Component Responsibilities

| Layer | File | Purpose |
|---|---|---|
| **UI** | `Calculator.tsx` | Renders the macOS-style calculator shell, buttons, display. Purely presentational — delegates all actions to the hook. |
| **State** | `useCalculator.ts` | Custom React hook managing display value, pending operator, operands, loading, and error state. Uses `useRef` to safely read state in async flows. |
| **API** | `api.ts` | Thin `fetch` wrapper for `POST /calculate`. Parses success/error responses and throws structured errors for the hook to catch. |
| **Entry** | `App.tsx` → `main.tsx` | Root component and React DOM mount point. |

---

## Project Structure

```
calculator-app/
├── Dockerfile              # Multi-stage build: Node → Nginx
├── .dockerignore
├── nginx.conf              # SPA fallback + /calculate reverse proxy
├── index.html              # Vite HTML entry
├── package.json
├── tsconfig.json
├── vite.config.ts          # Vite config with dev proxy to Go backend
├── vitest.config.ts        # Vitest config (jsdom environment)
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx            # React DOM root
    ├── App.tsx             # Root layout component
    ├── Calculator.tsx      # Calculator UI component
    ├── useCalculator.ts    # Custom hook — calculator state machine
    ├── api.ts              # Backend API client
    ├── index.css           # Tailwind directives + display CSS
    ├── vite-env.d.ts       # Vite type references
    └── test/
        ├── setup.ts        # jest-dom matchers for Vitest
        └── Calculator.test.tsx  # Component tests (13 cases)
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Docker** (optional, for containerized deployment)
- **Go backend** running on port `8080` (for calculations)

---

## Getting Started

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

The dev server starts at `http://localhost:5173` with a proxy that forwards `POST /calculate` requests to `http://localhost:8080` (the Go backend).

> **Note:** The Go backend must be running on port 8080 for calculations to work.

### Build for production

```bash
npm run build
```

Outputs static assets to `dist/`.

### Preview the production build

```bash
npm run preview
```

---

## Running Tests

```bash
# Single run
npm test

# Watch mode
npm run test:watch
```

### Test Coverage

The test suite (`src/test/Calculator.test.tsx`) covers **13 cases**:

| # | Test Case | What it verifies |
|---|---|---|
| 1 | Initial display | Renders `0` on mount |
| 2 | Digit entry | `1` → `2` → `3` shows `123` |
| 3 | Leading zero replacement | Pressing `5` replaces `0` with `5` |
| 4 | Decimal point | `3` → `.` → `1` shows `3.1` |
| 5 | Multiple decimals blocked | `1` → `.` → `.` → `2` shows `1.2` |
| 6 | AC (clear) | Resets display to `0` |
| 7 | Toggle sign (+/−) | `7` → `+/−` shows `-7` |
| 8 | Addition via backend | `5 + 3 =` calls API and shows `8` |
| 9 | Division via backend | `10 ÷ 2 =` calls API and shows `5` |
| 10 | Divide-by-zero error | `5 ÷ 0 =` shows error message from backend |
| 11 | Chained operations | `3 + 4 × 2 =` resolves sequentially (`7` then `14`) |
| 12 | Max digit length | Stops accepting input after 16 digits |
| 13 | Decimal after operator | `5 + .3` resets operand to `0.3` |

---

## API Contract

The frontend communicates with the Go backend via a single endpoint:

### `POST /calculate`

**Request body:**

```json
{
  "a": 5,
  "b": 3,
  "operation": "add"
}
```

| Field | Type | Description |
|---|---|---|
| `a` | `number` | First operand |
| `b` | `number` | Second operand |
| `operation` | `string` | One of: `add`, `subtract`, `multiply`, `divide` |

**Success response (200):**

```json
{
  "result": 8
}
```

**Error response (400):**

```json
{
  "error": "Cannot divide by zero"
}
```

### Sample payloads

```bash
# Add
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{"a": 5, "b": 3, "operation": "add"}'

# Subtract
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{"a": 10, "b": 4, "operation": "subtract"}'

# Multiply
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{"a": 7, "b": 6, "operation": "multiply"}'

# Divide
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{"a": 15, "b": 4, "operation": "divide"}'

# Divide by zero (error)
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{"a": 10, "b": 0, "operation": "divide"}'
```

---

## Docker

### Build the image

```bash
docker build -t calculator-fe .
```

### Run the container

```bash
docker run -p 3000:80 calculator-fe
```

The app is served at `http://localhost:3000`. The Nginx configuration proxies `/calculate` to `http://backend:8080` — this expects a Docker network where the Go backend container is named `backend`.

### Docker Compose example

```yaml
version: "3.9"
services:
  frontend:
    build: .
    ports:
      - "3000:80"
    depends_on:
      - backend

  backend:
    image: your-go-backend-image
    ports:
      - "8080:8080"
```

```bash
docker compose up --build
```

---

## Edge Case Handling

| Scenario | Behavior |
|---|---|
| **Very long numbers** | Input is capped at 16 digits. Results exceeding 16 characters are displayed in exponential notation. |
| **Multiple decimal points** | Only one `.` is allowed per operand. Additional presses are ignored. |
| **Decimal after operator** | Pressing `.` immediately after an operator starts a new operand with `0.`. |
| **Rapid operator switching** | Pressing `+` then `×` before entering a second operand swaps the pending operator without triggering an API call. |
| **`=` with no operation** | Ignored — `=` only fires when there is a pending operator. |
| **Backend errors** | Displayed in red text above the display. Cleared on the next user input. |
| **Loading state** | Display pulses with reduced opacity. All buttons are disabled to prevent double-submission. |
| **Display overflow** | Fixed-height display container with CSS `text-overflow: ellipsis`. Layout never shifts regardless of content length. |

---

## Responsive Design

The calculator scales to the viewport using Tailwind CSS responsive breakpoints:

| Breakpoint | Max width | Button height | Font size |
|---|---|---|---|
| `< 640px` | `20rem` | `3.5rem` | `text-lg` |
| `sm (≥ 640px)` | `24rem` | `4rem` | `text-xl` |
| `md (≥ 768px)` | `28rem` | `4.5rem` | `text-2xl` |
| `lg (≥ 1024px)` | `32rem` | `5rem` | `text-2xl` |

The layout responds to **viewport/orientation changes** but never resizes due to content changes (fixed display height, CSS-based text scaling).

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [React 18](https://react.dev) | UI library |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS 3](https://tailwindcss.com) | Utility-first styling |
| [Vitest](https://vitest.dev) | Unit & component testing |
| [Testing Library](https://testing-library.com) | DOM testing utilities |
| [Nginx](https://nginx.org) | Production static file server & reverse proxy |
| [Docker](https://www.docker.com) | Containerized builds & deployment |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest test suite (single run) |
| `npm run test:watch` | Run Vitest in watch mode |
