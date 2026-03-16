# Frontend — Workflow Automation Builder

The frontend is a React single-page application that provides a visual, drag-and-drop workflow editor. Users build automation pipelines by placing nodes on a canvas, connecting them, configuring each node, and triggering execution — all without writing code.

---

## Table of Contents

- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Workflow Builder UI](#workflow-builder-ui)
- [Node System](#node-system)
- [React Flow Usage](#react-flow-usage)
- [State Management](#state-management)
- [Routing](#routing)
- [Hooks](#hooks)
- [Serialization and Deserialization](#serialization-and-deserialization)
- [Running the Frontend](#running-the-frontend)
- [Connecting to the Backend](#connecting-to-the-backend)
- [UI Screenshots](#ui-screenshots)

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                        │
│                                                                │
│  React Router                                                  │
│    /                   WorkflowListPage                        │
│    /workflows/:id      WorkflowEditorPage                      │
│                              │                                 │
│         ┌────────────────────┼────────────────────┐           │
│         │                   │                    │           │
│  ┌──────▼──────┐   ┌────────▼────────┐  ┌────────▼───────┐  │
│  │ NodePalette │   │ WorkflowCanvas  │  │   Right Panel  │  │
│  │ (drag source│   │ (React Flow)    │  │                │  │
│  │  for nodes) │   │                 │  │ ┌────────────┐ │  │
│  └─────────────┘   │  ┌───────────┐  │  │ │ConfigPanel │ │  │
│                    │  │ Node      │  │  │ │(per-node   │ │  │
│                    │  │ Components│  │  │ │ form)      │ │  │
│                    │  │ (7 types) │  │  │ └────────────┘ │  │
│                    │  └───────────┘  │  │ ┌────────────┐ │  │
│                    └────────────────┘  │ │TriggerPanel│ │  │
│                                        │ │(run + poll)│ │  │
│                         ┌──────────────┤ └────────────┘ │  │
│                         │              │ ┌────────────┐ │  │
│                         │              │ │ResultsPanel│ │  │
│                         │              │ │(exec log)  │ │  │
│                         │              │ └────────────┘ │  │
│                         │              └────────────────┘  │
│                         │                                   │
│              ┌──────────▼──────────┐                        │
│              │    Zustand Stores   │                        │
│              │  workflowStore      │                        │
│              │  executionStore     │                        │
│              └─────────────────────┘                        │
└────────────────────────────────────────────────────────────────┘
                          │ REST API
                    Backend (Express)
```

---

## Directory Structure

```
frontend/
└── src/
    ├── components/
    │   ├── canvas/
    │   │   ├── CanvasToolbar.tsx      # Top bar: workflow name, Save, Run buttons
    │   │   ├── NodePalette.tsx        # Left sidebar: draggable node type chips
    │   │   └── WorkflowCanvas.tsx     # React Flow wrapper, drag-drop, edge creation
    │   ├── nodes/
    │   │   ├── BaseNode.tsx           # Shared node shell (handles, label, selection ring)
    │   │   ├── WebhookNode.tsx        # Entry point node
    │   │   ├── TransformNode.tsx      # Field mapping preview
    │   │   ├── ConditionNode.tsx      # Branch handles (one handle per branch value)
    │   │   ├── EmailNode.tsx          # Email recipient preview
    │   │   ├── DelayNode.tsx          # Delay duration preview
    │   │   ├── AINode.tsx             # AI prompt preview
    │   │   └── StoreNode.tsx          # Store (no config needed)
    │   └── panels/
    │       ├── ConfigPanel.tsx        # Right panel: per-node configuration forms
    │       ├── TriggerPanel.tsx       # Right panel: JSON payload editor + Run button
    │       └── ResultsPanel.tsx       # Right panel: execution log + final output
    ├── hooks/
    │   ├── useWorkflow.ts             # Load and save workflow via REST API
    │   └── useExecution.ts            # Trigger, poll, highlight edges
    ├── pages/
    │   ├── WorkflowListPage.tsx       # Homepage: list + create workflows
    │   └── WorkflowEditorPage.tsx     # Full editor (canvas + panels)
    ├── store/
    │   ├── workflowStore.ts           # Selected node, active tab, workflow metadata
    │   └── executionStore.ts          # Execution status, log, result, visited nodes
    ├── types/
    │   └── index.ts                   # Shared TS types (NodeData, WorkflowDef, etc.)
    ├── utils/
    │   ├── serializeFlow.ts           # React Flow state → WorkflowDef JSON
    │   └── deserializeFlow.ts         # WorkflowDef JSON → React Flow state
    ├── App.tsx                        # Router setup
    └── main.tsx                       # Vite entry point
```

---

## Workflow Builder UI

The editor page (`WorkflowEditorPage`) is divided into three zones:

```
┌─────────┬──────────────────────────────┬──────────────┐
│  Node   │                              │  Right Panel │
│ Palette │       React Flow Canvas      │              │
│         │                              │  [ Config ]  │
│ Webhook │   ┌────────┐  ┌──────────┐  │  [ Run    ]  │
│Transform│   │Webhook │─▶│Transform │  │  [ Results]  │
│Condition│   └────────┘  └────┬─────┘  │              │
│  Email  │                    │        │              │
│  Delay  │               ┌────▼─────┐  │              │
│   AI    │               │Condition │  │              │
│  Store  │               └────┬─────┘  │              │
│         │                    │"35"    │              │
│         │               ┌────▼─────┐  │              │
│         │               │  Email   │  │              │
│         │               └──────────┘  │              │
└─────────┴──────────────────────────────┴──────────────┘
```

### Interactions

| Action | How |
|--------|-----|
| Add a node | Drag from Node Palette onto the canvas |
| Connect nodes | Drag from a source handle (bottom of node) to a target handle (top of node) |
| Configure a node | Click to select → Config tab opens in the right panel |
| Save | Click **Save** in the toolbar (auto-saves before every run) |
| Run | Click **Run** tab → paste JSON payload → click **Run Workflow** |
| View results | Results tab shows per-node log after execution completes |

---

## Node System

Every node is a React component receiving `NodeProps<NodeData>` from React Flow. All nodes share a common shell via `BaseNode`, which handles:

- Target handle (top) — incoming connection point
- Source handles (bottom) — one or more outgoing connection points
- Selection highlight ring
- Node label

```typescript
// types/index.ts
interface NodeData {
  type: string;
  label: string;
  config: Record<string, unknown>;
}
```

The `config` field is a free-form object specific to each node type. It is edited via `ConfigPanel` and serialized into the `WorkflowDef` on save.

### ConditionNode — dynamic handles

The Condition node is the only node with variable source handles. The number and labels of its handles are derived from its configured branches:

```typescript
// ConditionNode.tsx
const sourceHandles: SourceHandle[] =
  branches.length > 0
    ? branches.map((b) => ({ id: b.value, label: b.value }))
    : [{ id: '__default__', label: 'output' }];
```

When a branch is configured with value `"35"`, a handle labelled `35` appears at the bottom of the node. **Edges must be drawn from this labelled handle** so that `sourceHandle` is correctly set to `"35"` and serialized as `edge.condition = "35"`.

> **Important:** If you draw the edge before configuring branches, the editor automatically remaps `sourceHandle: "__default__"` to the first branch value when you add the branch. This prevents silent routing mismatches at execution time.

---

## React Flow Usage

React Flow is used for the entire canvas:

- **Node types** are registered as custom components via the `nodeTypes` map passed to `<ReactFlow>`
- **Edges** use the default React Flow smooth-step style
- **`onConnect`** creates new edges; edge `sourceHandle` is automatically set by React Flow to the handle ID the user dragged from
- **`onDrop` / `onDragOver`** handle node palette drops onto the canvas
- **`useNodesState` / `useEdgesState`** manage local React Flow state in `WorkflowEditorPage`

### Edge highlighting after execution

After an execution completes, `useExecution` computes which edges connect nodes that were visited, and applies animated styling to those edges:

```typescript
// highlights edges between visited nodes
function buildHighlightedEdges(
  edges: RFEdge[],
  visitedNodeIds: Set<string>
): RFEdge[]
```

---

## State Management

State is split across two Zustand stores to separate concerns.

### `workflowStore`

Manages editor-level UI state:

```typescript
interface WorkflowStore {
  workflowId: string | null;
  workflowName: string;
  selectedNodeId: string | null;       // which node's config to show
  activeTab: 'config' | 'run' | 'results';

  setSelectedNodeId: (id: string | null) => void;
  setActiveTab: (tab: ...) => void;
  reset: () => void;
}
```

Selecting a node automatically switches the active tab to `'config'`.

### `executionStore`

Manages execution lifecycle state:

```typescript
interface ExecutionStore {
  executionId: string | null;
  status: ExecStatus;              // 'running' | 'completed' | 'failed'
  execLog: ExecLogEntry[];
  resultJson: Record<string, unknown> | null;
  visitedNodeIds: Set<string>;     // used for edge highlighting

  setResult: (result: ExecutionResult) => void;
  reset: () => void;
}
```

`visitedNodeIds` is derived from `execLog` when results arrive — it holds every `nodeId` that ran successfully, used to highlight edges on the canvas.

---

## Routing

React Router DOM v6 with two routes:

```typescript
// App.tsx
<Routes>
  <Route path="/"               element={<WorkflowListPage />} />
  <Route path="/workflows/:id"  element={<WorkflowEditorPage />} />
  <Route path="*"               element={<Navigate to="/" replace />} />
</Routes>
```

The editor is always wrapped in `<ReactFlowProvider>` so all React Flow hooks have access to the flow instance.

---

## Hooks

### `useWorkflow`

Handles loading and saving workflow definitions via the REST API.

```typescript
const { load, save } = useWorkflow();

// Load workflow + deserialize into React Flow nodes/edges
await load(workflowId, setNodes, setEdges);

// Serialize + PUT to backend
await save(workflowId, nodes, edges);
```

### `useExecution`

Handles the full execution lifecycle: trigger → poll → store results.

```typescript
const { trigger, poll, buildHighlightedEdges } = useExecution();
```

- **`trigger(workflowId, payload)`** — calls `/api/workflows/:id/trigger`, stores `executionId`
- **Polling** — calls `GET /api/executions/:executionId` on an interval until status is not `"running"`, then populates `executionStore`
- **`buildHighlightedEdges`** — derives animated edge styles from `visitedNodeIds`

---

## Serialization and Deserialization

### `serializeFlow` — canvas → backend

```typescript
// utils/serializeFlow.ts
export function serializeFlow(
  nodes: Node<NodeData>[],
  edges: RFEdge[]
): WorkflowDef
```

- Maps each React Flow node to a `NodeDef` (id, type, label, config, position)
- Maps each React Flow edge to a `WorkflowEdge`, setting `condition` from `sourceHandle`

```typescript
// The sourceHandle on edges from Condition nodes carries the branch value
condition: (e.sourceHandle ?? e.data?.condition) as string | undefined
```

### `deserializeFlow` — backend → canvas

```typescript
// utils/deserializeFlow.ts
export function deserializeFlow(
  def: WorkflowDef
): { nodes: Node<NodeData>[]; edges: RFEdge[] }
```

- Reconstructs React Flow node objects with `type`, `data`, and `position` from saved `NodeDef`
- Reconstructs edges with `sourceHandle` set from the saved `condition` field so branch handles reconnect correctly after reload

---

## Running the Frontend

```bash
# Install dependencies
cd frontend
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
# → http://localhost:5173
```

### Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Connecting to the Backend

The frontend reads the backend base URL from an environment variable:

```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000
```

All API calls use this base URL as a prefix. In production, set this to the deployed backend URL.

If the variable is not set, the frontend defaults to `http://localhost:3000`.

---

## UI Screenshots

### Workflow List Page
> _The home screen listing all saved workflows with name, last modified date, and a button to open the editor._

```
┌──────────────────────────────────────────────────┐
│  Workflow Automation Builder        [+ New]       │
├──────────────────────────────────────────────────┤
│  ◎ Temperature Alert      Updated 2 min ago  [▶] │
│  ◎ Order Confirmation     Updated 1 hr ago   [▶] │
│  ◎ Lead Enrichment        Updated yesterday  [▶] │
└──────────────────────────────────────────────────┘
```

### Workflow Editor — Canvas
> _The main editor with the node palette on the left, the React Flow canvas in the centre, and the config/run/results panel on the right._

```
┌────────┬──────────────────────────────────┬──────────────────┐
│Webhook │                                  │ Config  Run  Res │
│Transfrm│  [Webhook]──►[Transform]         ├──────────────────┤
│Conditn │                   │              │ Field: temp_cels  │
│ Email  │              [Condition]         │ Branches:        │
│ Delay  │                   │"35"          │  gt · 35         │
│  AI    │               [Email]            │                  │
│ Store  │                                  │ [+ Add Branch]   │
└────────┴──────────────────────────────────┴──────────────────┘
```

### Results Panel — Execution Log
> _After a run completes, the per-node log showing input, output, status, and duration for each node._

```
┌─────────────────────────────────────────────┐
│ Execution  completed  ✓  4 nodes  48ms      │
├─────────────────────────────────────────────┤
│ ✅ webhook      2ms   output: {temperature} │
│ ✅ transform    1ms   output: {temp_celsius} │
│ ✅ condition    1ms   _branch: "35"          │
│ ✅ email        44ms  email_sent: true       │
└─────────────────────────────────────────────┘
```