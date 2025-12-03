<!-- 4d8cfc65-f103-44e7-a828-c015ae6b4a6a aab1ce7a-6c0b-4f54-80db-4850c67ea241 -->
## Python Tracing Game – Implementation Plan (Static, JSON-Based)

### Approach Recommendation

- **Use a static, JSON-based design**: keep everything running on GitHub Pages with **no backend**.
- **Pre-generate golden traces** for each challenge offline (in your own Python environment) and store them as JSON files that the front-end loads.
- This is **simplest and safest** for classroom use: no servers, no code execution in the browser, and fully compatible with your current hosting setup.

### High-Level Structure

- **Front-end only**, reusing your existing app shell (`index.html`, `styles.css`, `ui.js`), and adding new files:
- [`challenges/algorithms.json`](challenges/algorithms.json) – metadata list of all tracing challenges.
- [`challenges/traces/<id>.json`](challenges/traces/...) – precomputed golden trace per challenge.
- [`python-trace-ui.js`](python-trace-ui.js) – UI logic for the tracing game (render code, table, handle input & checking).
- `[python-challenges.md]` (optional) – human-readable list of challenges for you as teacher.
- The **binary tree game** stays as-is under the `Binary Tree Traversal` menu option; the new tracing game appears when `Python Algorithm Tracing` is selected.

### Front-End Flow (Student)

1. **Select mode** in the existing menu:

- `Binary Tree Traversal` (existing game).
- `Python Algorithm Tracing` (new game).

2. In tracing mode, the UI shows:

- A **challenge selector** (dropdown or list) built from `algorithms.json`.
- Left: **syntax-highlighted Python code** for the selected challenge.
- Right-top: **description + given inputs**.
- Right-bottom: an **interactive trace table** whose columns/rows come from the challenge’s `trace_config` and golden trace.

3. Student fills required cells and clicks **“Check trace”**.
4. Front-end compares their entries to the golden trace JSON and:

- Colors each cell **green/red**.
- Computes a **score %** and shows a short feedback message.
- Optionally offers **“Retry wrong cells”** or **“Reveal answer”**.

### Data Model & JSON Files

- **Challenge metadata (`algorithms.json`)**
- Array of objects, each like:
 - `id`, `title`, `description`, `difficulty`, `topic`, `python_code`, `inputs`, `trace_config`.
- `trace_config` defines:
 - Which **columns** to show (step, line, variables, condition, output, call depth, call id, return value, etc.).
 - Which columns are **pre-filled** vs **student-filled**.
- **Golden trace per challenge (`traces/<id>.json`)**
- Canonical list of steps, each like:
 - `step_index`, `line_number`, `variables`, `condition_results`, `output`, and for recursion: `call_id`, `call_depth`, `frame_name`, `return_value`.
- This structure is exactly what the UI uses to compute correctness.

### Trace Generation (Offline Teacher Tool)

- Write a **separate, offline Python script** (not part of the web app) that:
- Loads a challenge definition (Python code + inputs).
- Uses `sys.settrace` or an AST transform to **instrument** the code.
- Executes it safely in a controlled environment.
- Captures the required fields at each step and outputs a JSON trace file.
- Workflow for you:
- Design a new challenge → run the generator script locally → commit the new JSON files → deploy via GitHub Pages.

### Front-End Implementation Steps

- **1. Extend HTML structure**
- In `index.html`, inside the `python-tracing-app` section, add:
 - A **challenge selector** (dropdown or sidebar list).
 - Containers for:
 - Code display (`<pre><code>` or a syntax highlight component).
 - Challenge description / inputs.
 - Trace table (`<table>` or div-based grid).
 - Feedback area (score, messages).

- **2. Shared styling**
- In `styles.css`, add styles for:
 - Code block panel (similar card style as your game panels).
 - Trace table (rows/columns, correct/incorrect cell colors, hover highlighting).
 - Mode labels and difficulty tags.

- **3. Tracing UI controller**
- In `python-trace-ui.js`, implement a separate controller class, e.g. `PythonTraceController`, responsible for:
 - Loading `algorithms.json` on startup.
 - Populating the challenge selector and handling challenge changes.
 - Rendering the Python code and trace table skeleton based on `trace_config`.
 - Tracking student input for each cell.
 - On “Check trace”, loading the corresponding golden trace JSON and comparing cell-by-cell.
 - Coloring cells and computing score.
- Wire this into your existing `DOMContentLoaded` handler **only when the Python mode is active**.

- **4. Comparison & scoring logic**
- Implement a comparison function that:
 - Iterates over each row/column that is student-editable.
 - Normalizes values (e.g. `"4"` vs `4`, case-insensitive for booleans `true/false` → `True/False`).
 - Marks each cell as correct/incorrect.
 - Aggregates a total **accuracy %**.
- Add options to:
 - Retry only wrong cells (keep correct ones locked/read-only).
 - Reveal the full correct trace.

- **5. Game modes inside tracing** (future enhancements)
- **Mode 1 (Fill-the-table)**: baseline implementation above.
- **Mode 2 (Find-the-error)**:
 - Pre-fill the table with a **perturbed trace** JSON (some cells intentionally wrong).
 - Students identify and fix them; scoring based on corrected cells.
- **Mode 3 (Step-by-step quiz)**:
 - Show a single step at a time, asking for specific variable values.
 - Reuse the same golden trace, but present it as a sequence of micro-questions.

### Progression & Analytics (Later)

- Add a lightweight progress tracker (stored in `localStorage` or your existing stats system):
- Per challenge: attempts, best score.
- Unlock logic: e.g., unlock recursion levels after N loop challenges with ≥X%.
- Optionally extend your existing `StatsManager` (from `game.js`) to also track tracing-game usage, keyed by challenge id.

### Safety & Hosting Considerations

- **No Python executes in the browser**: only precomputed traces are used.
- Everything remains **static** and hostable on GitHub Pages.
- You retain full control of what code and inputs are allowed because you generate all traces offline.

If you approve this plan, the next step is to: (1) extend the HTML and CSS to flesh out the `python-tracing-app` UI, (2) add `algorithms.json` and a couple of starter challenges, and (3) implement `python-trace-ui.js` to make the tracing game playable for an initial simple loop challenge.

### To-dos

- [ ] Create project structure with HTML, CSS, and JavaScript files
- [ ] Implement binary tree data structure and generation algorithm with difficulty-based sizing
- [ ] Implement in-order, pre-order, and post-order traversal algorithms
- [ ] Create tree visualization component to display binary trees visually
- [ ] Implement drag-and-drop functionality for arranging nodes
- [ ] Build game flow: difficulty selection, traversal type selection, answer validation
- [ ] Implement countdown timer with visual feedback and auto-submit
- [ ] Style the game interface with modern, educational-friendly design
- [ ] Configure for GitHub Pages deployment and create README with instructions
- [ ] Extend `index.html` and `styles.css` to flesh out the Python tracing app section (code panel, challenge selector, trace table container, feedback area).
- [ ] Create `challenges/algorithms.json` with a small set of initial challenges and a clear `trace_config` schema for columns and editable cells.
- [ ] Create `python-trace-ui.js` with a controller that loads challenges, renders code and tables, handles student input, and compares answers to golden traces.
- [ ] Design and document an offline Python script to generate canonical golden traces from challenge definitions and inputs into `challenges/traces/*.json`.},{