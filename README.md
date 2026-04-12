# JS Lens

**An interactive JavaScript runtime visualizer that brings the event loop to life.**

JS Lens lets you write JavaScript code and watch it execute step-by-step, visualizing the call stack, task queues, Web APIs, variable scopes, and console output in real time. Built for developers who want to truly understand how JavaScript works under the hood.

![Built with React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Why JS Lens?](#why-js-lens)
- [Features](#features)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
  - [Architecture Overview](#architecture-overview)
  - [The Engine Pipeline](#the-engine-pipeline)
  - [State Management](#state-management)
  - [UI Components](#ui-components)
- [Built-in Presets](#built-in-presets)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## Why JS Lens?

JavaScript's asynchronous behavior is one of the hardest concepts for developers to grasp. Questions like:

- *Why does `setTimeout(..., 0)` not execute immediately?*
- *Why do Promises resolve before `setTimeout` callbacks?*
- *What actually happens in the event loop?*
- *How do closures capture variables?*

JS Lens answers these questions visually. Instead of reading about the event loop, you **watch it work** with your own code.

---

## Features

### Runtime Visualization
- **Call Stack** -- See functions push and pop in real time as your code executes
- **Microtask Queue** -- Watch Promise callbacks and `queueMicrotask` entries queue and drain
- **Macrotask Queue** -- Observe `setTimeout` and `setInterval` callbacks waiting their turn
- **Web APIs Panel** -- See timers register with countdown progress indicators
- **Event Loop Indicator** -- Animated SVG loop that activates when the event loop processes queues

### Code Intelligence
- **Concept Detection** -- Automatically detects 8 JavaScript patterns in your code: closures, promises/async, higher-order functions, recursion, IIFEs, generators, prototypes/classes, and event-driven patterns
- **Scope Inspector** -- Hierarchical tree view of all variable scopes, showing how closures capture outer variables
- **Console Output** -- Real console output from sandboxed execution, color-coded by log level (log, warn, error)

### Editor & Controls
- **Monaco Editor** -- Full-featured code editor with syntax highlighting and line decoration
- **Step-by-Step Mode** -- Manually advance through each execution step at your own pace
- **Auto-Play Mode** -- Watch the entire execution animate automatically
- **Speed Control** -- 5-level speed slider from slow (1.5s per step) to fast (100ms per step)
- **9 Built-in Presets** -- Curated examples covering core JavaScript concepts
- **Line Highlighting** -- The current line being executed is highlighted in the editor
- **Step Tooltips** -- Each step displays a description of what's happening

### Design
- **Dark Theme** -- Purpose-built dark UI optimized for readability
- **Resizable Panels** -- Three-panel layout that you can resize to your preference
- **Smooth Animations** -- Framer Motion spring physics for natural, fluid transitions

---

## Screenshots

> *Run the app locally to see it in action -- `npm run dev`*

**Layout Overview:**

```
+----------------+----------------------+-----------------+
|                |                      |                 |
|   Code Editor  |  Runtime Visualizer  |  Code Intel     |
|                |                      |                 |
|  - Monaco      |  - Call Stack        |  - Concepts     |
|  - Presets     |  - Web APIs          |  - Scope Tree   |
|  - Toolbar     |  - Event Loop        |  - Console      |
|                |  - Microtask Queue   |                 |
|                |  - Macrotask Queue   |                 |
|                |                      |                 |
+----------------+----------------------+-----------------+
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/js-lens.git
cd js-lens

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## How It Works

### Architecture Overview

JS Lens has a clean three-layer architecture:

```
+---------------------------------------------------------+
|                     UI Layer (React)                     |
|  Editor Panel  |  Visualizer Panel  |  Intelligence Panel|
+---------------------------------------------------------+
                          |
+---------------------------------------------------------+
|                  State Layer (Zustand)                   |
|      useEditorStore      |     useExecutionStore         |
+---------------------------------------------------------+
                          |
+---------------------------------------------------------+
|                    Engine Layer                          |
|  Code Instrumentor | Sandbox Runner | Step Runner       |
|                    | Concept Detector                   |
+---------------------------------------------------------+
```

**Data flows in one direction:**

1. User writes code in the editor
2. The engine parses it into visualization steps
3. Steps are applied to Zustand stores
4. React components react to state changes and render visualizations

---

### The Engine Pipeline

When you click **Run**, four engine modules work together:

#### 1. Code Instrumentor (`src/engine/codeInstrumentor.js`)

The instrumentor is the heart of JS Lens. It parses your JavaScript code and produces a sequence of **steps** that represent the execution flow. It does **not** use an AST parser -- instead, it uses a multi-phase regex and line-based analysis approach:

**Phase 1 -- Function Extraction:**
Scans all lines for function declarations (`function foo() {}`), arrow functions, function expressions, and IIFEs. Stores metadata including name, parameters, line range, and whether the function is async or a generator.

**Phase 2 -- Async Callback Collection:**
Identifies all asynchronous operations (`setTimeout`, `setInterval`, `.then()`, `queueMicrotask`) and finds their callback bodies using a brace-depth counter. Builds "skip ranges" so callback bodies aren't processed during the top-level walk.

**Phase 3 -- Top-Level Walk:**
Iterates through global scope lines sequentially, skipping function bodies and async callback ranges. For each line, it detects the statement type and generates the appropriate step:

| Statement | Steps Generated |
|-----------|----------------|
| `console.log(...)` | `callstack_push` -> `console` -> `callstack_pop` |
| `setTimeout(cb, n)` | `webapi_add` -> `macrotask_add` |
| `Promise.then(cb)` | `microtask_add` |
| `functionCall()` | `callstack_push` -> (walk body) -> `callstack_pop` |
| `const x = value` | `scope_update` |
| `await expr` | `microtask_add` (for resumption) |

**Phase 4 -- Queue Draining (Event Loop Simulation):**
After all synchronous code is processed, the instrumentor simulates the event loop:
1. Drain **all** microtasks (Promises, queueMicrotask) -- microtasks can enqueue more microtasks
2. Process **one** macrotask (setTimeout, setInterval)
3. Repeat until both queues are empty

This accurately models the real JavaScript event loop behavior, which is why `Promise.then` callbacks always execute before `setTimeout` callbacks.

**Step Types:**

| Step Type | Description |
|-----------|-------------|
| `callstack_push` | Push a frame onto the call stack |
| `callstack_pop` | Pop the top frame off the call stack |
| `scope_update` | Declare or update a variable in current scope |
| `scope_push` | Create a new function scope |
| `microtask_add` | Queue a microtask (Promise, queueMicrotask) |
| `microtask_run` | Execute a microtask from the queue |
| `macrotask_add` | Queue a macrotask (setTimeout, setInterval) |
| `macrotask_run` | Execute a macrotask from the queue |
| `webapi_add` | Register a Web API timer |
| `event_loop_tick` | Event loop is checking queues |
| `console` | Console output |

#### 2. Sandbox Runner (`src/engine/sandboxRunner.js`)

Executes the user's code in a **hidden iframe** with the `sandbox="allow-scripts"` attribute. This provides real execution results while keeping the main page safe.

**How it works:**
1. Creates (or reuses) a hidden iframe
2. Wraps user code in an async IIFE for top-level `await` support
3. Intercepts `console.log/warn/error` inside the iframe
4. Sends results back via `postMessage` with a nonce to prevent stale messages
5. Estimates timeout based on the longest `setTimeout` delay found in the code (capped at 4.5s)

The sandbox output is **matched** against instrumented console steps -- if the instrumentor predicted `console.log('hello')`, the sandbox confirms the actual output was `"hello"`.

#### 3. Step Runner (`src/engine/stepRunner.js`)

Orchestrates execution by connecting the instrumentor and sandbox to the UI stores.

**Two execution modes:**

**Auto-Play (`runAllSteps`):**
1. Resets all execution state
2. Runs code in the sandbox (captures real output)
3. Steps through each instrumented step with a delay between them
4. Matches console steps to sandbox output
5. Flushes any unmatched sandbox output at the end

**Step Mode (`prepareSteps` + `stepForward`):**
1. Generates all steps upfront
2. User manually advances with the Step button
3. Each click applies one step and updates the UI

**Speed control:**
```
Speed 1:  1500ms per step  (slowest)
Speed 2:  1000ms per step
Speed 3:   600ms per step
Speed 4:   300ms per step
Speed 5:   100ms per step  (fastest)

Event loop ticks get a 1.5x multiplier for emphasis.
```

#### 4. Concept Detector (`src/engine/conceptDetector.js`)

Scans the code with regex patterns to detect 8 JavaScript concepts:

| Concept | What it detects |
|---------|----------------|
| Closure | Nested functions referencing outer variables |
| Promise / Async | `new Promise`, `.then`, `async`, `await` |
| Higher-Order Function | `.map`, `.filter`, `.reduce`, functions returning functions |
| Recursion | Functions that call themselves |
| IIFE | `(function(){})()` or `(() => {})()` |
| Generator | `function*` with `yield` |
| Prototype / Class | `.prototype`, `class`, `extends` |
| Event-driven | `addEventListener`, `setTimeout`, event listeners |

Each detected concept appears as an interactive badge with an explanation drawer containing descriptions and visual diagrams.

---

### State Management

JS Lens uses two **Zustand** stores:

#### `useEditorStore` -- Editor & Control State

| State | Type | Purpose |
|-------|------|---------|
| `code` | `string` | Current code in the editor |
| `preset` | `string` | Selected preset name |
| `stepMode` | `boolean` | Manual step vs auto-play toggle |
| `currentStep` | `number` | Current step index |
| `totalSteps` | `number` | Total steps in current visualization |
| `isRunning` | `boolean` | Whether execution is in progress |
| `speed` | `number` | Speed slider value (1-5) |

#### `useExecutionStore` -- Visualization State

| State | Type | Purpose |
|-------|------|---------|
| `callStack` | `Frame[]` | Current call stack frames |
| `microtaskQueue` | `Task[]` | Pending microtasks |
| `macrotaskQueue` | `Task[]` | Pending macrotasks |
| `webAPIs` | `API[]` | Active Web API timers with countdown |
| `scopeTree` | `ScopeNode` | Hierarchical variable scope tree |
| `consoleOutput` | `ConsoleEntry[]` | Console log entries |
| `eventLoopActive` | `boolean` | Whether event loop indicator is active |
| `highlightLine` | `number` | Line number highlighted in editor |
| `stepTooltip` | `string` | Description of current step |

---

### UI Components

#### Editor Panel
- **CodeEditor** -- Monaco Editor with real-time line highlighting, preset selector, and step tooltip overlay
- **EditorToolbar** -- Step counter and manual advance button (visible in step mode)

#### Visualizer Panel
- **CallStack** -- Animated stack of function frames with entry/exit transitions
- **WebAPIsBox** -- Active timers with live countdown progress (updates every 100ms)
- **EventLoopIndicator** -- Animated SVG circular loop, turns green when the event loop is processing
- **MicrotaskQueue** -- Horizontal scrollable queue with purple-themed task cards
- **MacrotaskQueue** -- Horizontal scrollable queue with amber-themed task cards

#### Intelligence Panel
- **ConceptDetector** -- Color-coded badges for detected patterns, clickable for explanations
- **ExplainerDrawer** -- Modal overlay with concept description, details, and SVG diagrams
- **ScopeInspector** -- Tree view of variable scopes with type-colored values
- **OutputConsole** -- Timestamped console output with log-level coloring and auto-scroll

---

## Built-in Presets

JS Lens ships with 9 curated examples:

| # | Preset | What it teaches |
|---|--------|----------------|
| 1 | **Event Loop Order** | Why sync runs first, then microtasks, then macrotasks |
| 2 | **Classic Closure** | How inner functions capture outer variables |
| 3 | **Promise Chain** | Sequential `.then()` chaining |
| 4 | **Async / Await** | How `await` pauses and resumes execution |
| 5 | **setTimeout vs Promise** | Direct comparison of macro vs micro task priority |
| 6 | **Recursive Fibonacci** | Recursive call stack growth and unwinding |
| 7 | **IIFE Pattern** | Immediately Invoked Function Expressions |
| 8 | **Array HOF Chain** | `.filter()` -> `.map()` -> `.reduce()` pipeline |
| 9 | **Generator Function** | `function*` with `yield` step-by-step execution |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 19 | UI components and rendering |
| **Build Tool** | Vite 8 | Dev server, HMR, production bundling |
| **State** | Zustand 5 | Lightweight, hook-based state management |
| **Editor** | Monaco Editor | Code editing with syntax highlighting |
| **Styling** | Tailwind CSS 3.4 | Utility-first dark-themed UI |
| **Animation** | Framer Motion 12 | Spring-based layout animations |
| **Layout** | react-resizable-panels | Draggable panel resizing |
| **Fonts** | Inter + JetBrains Mono | UI typography + monospace code font |
| **Testing** | Vitest + Testing Library | Unit and component tests |
| **Language** | JavaScript (JSX) + TypeScript config | Source code with TS-powered tooling |

---

## Project Structure

```
js-lens/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── engine/                        # Core execution engine
│   │   ├── codeInstrumentor.js        # Parses code into visualization steps
│   │   ├── conceptDetector.js         # Detects JS patterns (closures, etc.)
│   │   ├── sandboxRunner.js           # Executes code safely in iframe
│   │   ├── stepRunner.js              # Orchestrates step-by-step execution
│   │   └── __tests__/                 # Engine unit tests
│   ├── store/                         # Zustand state stores
│   │   ├── useEditorStore.js          # Editor state (code, presets, mode)
│   │   ├── useExecutionStore.js       # Visualization state (stacks, queues)
│   │   └── __tests__/                 # Store tests
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── CodeEditor.jsx         # Monaco editor with line highlighting
│   │   │   └── EditorToolbar.jsx      # Step controls
│   │   ├── Visualizer/
│   │   │   ├── CallStack.jsx          # Animated call stack display
│   │   │   ├── WebAPIsBox.jsx         # Timer countdown panel
│   │   │   ├── EventLoopIndicator.jsx # Animated event loop SVG
│   │   │   ├── MicrotaskQueue.jsx     # Promise queue display
│   │   │   ├── MacrotaskQueue.jsx     # Timer queue display
│   │   │   └── QueueCard.jsx          # Reusable queue item card
│   │   ├── Intel/
│   │   │   ├── ConceptDetector.jsx    # Pattern detection badges
│   │   │   ├── ExplainerDrawer.jsx    # Concept explanation modal
│   │   │   ├── ScopeInspector.jsx     # Variable scope tree
│   │   │   └── OutputConsole.jsx      # Console output display
│   │   ├── Navbar/
│   │   │   └── Navbar.jsx            # Top bar with run/reset controls
│   │   └── __tests__/                # Component tests
│   ├── styles/
│   │   └── index.css                 # Tailwind directives + custom styles
│   ├── App.jsx                       # Root layout with resizable panels
│   └── main.tsx                      # React entry point
├── index.html                        # HTML shell
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.app.json
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit your changes and push to your fork
7. Open a pull request

### Development Tips

- The engine files in `src/engine/` are pure JavaScript with no React dependencies -- easy to test and modify independently
- All visualization state flows through Zustand stores -- check `useExecutionStore.js` to understand what data each component consumes
- Presets are defined in `useEditorStore.js` -- add new ones by extending the `PRESETS` object
- The sandbox uses `postMessage` for iframe communication -- check the browser console if output isn't matching

---

<p align="center">
  <strong>JS Lens</strong> -- See your JavaScript execute, step by step.
</p>
