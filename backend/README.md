# Backend — Workflow Automation Builder

The backend is a Node.js/Express REST API that stores workflow definitions and runs them through a recursive graph execution engine. It is written in TypeScript and uses Prisma with PostgreSQL for persistence.

---

## Table of Contents

- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Workflow Execution Engine](#workflow-execution-engine)
- [Node Handler System](#node-handler-system)
- [Branch Execution Logic](#branch-execution-logic)
- [Parallel Execution Logic](#parallel-execution-logic)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Development Setup](#development-setup)
- [Logging System](#logging-system)

---

## Architecture

```
HTTP Request
     │
     ▼
┌──────────────────────────────────────────────┐
│              Express.js App                  │
│                                              │
│  requestLogger ──► routes ──► errorHandler   │
│                                              │
│  /api/workflows      workflowService         │
│  /api/webhook    ──► executionService ──────┐│
│  /api/executions                            ││
└─────────────────────────────────────────────┼┘
                                              │
                    ┌─────────────────────────▼──────┐
                    │       Execution Engine          │
                    │                                 │
                    │  executeWorkflow()              │
                    │    │                            │
                    │    ├─ buildAdjacencyMap()       │
                    │    ├─ buildNodeMap()            │
                    │    └─ executeNode() [recursive] │
                    │         │                       │
                    │         ├─ registry.get(type)   │
                    │         ├─ handler.run()        │
                    │         └─ routing logic        │
                    └─────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │          Node Handlers          │
                    │  WebhookHandler                 │
                    │  TransformHandler               │
                    │  ConditionHandler               │
                    │  EmailHandler                   │
                    │  DelayHandler                   │
                    │  AIHandler                      │
                    │  StoreHandler                   │
                    └─────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │      Prisma ORM / PostgreSQL    │
                    └─────────────────────────────────┘
```

---

## Directory Structure

```
backend/
├── prisma/
│   └── schema.prisma              # Prisma data models
└── src/
    ├── ai/
    │   ├── factory.ts             # Returns configured AI provider
    │   ├── openai.provider.ts     # OpenAI completion adapter
    │   ├── gemini.provider.ts     # Google Gemini completion adapter
    │   └── utils.ts               # extractJSON() helper
    ├── db/
    │   └── client.ts              # Prisma client singleton
    ├── engine/
    │   ├── executor.ts            # Core graph walker
    │   ├── registry.ts            # Node handler registry (singleton)
    │   └── types.ts               # WorkflowDef, ExecContext, ExecLogEntry, Edge
    ├── middleware/
    │   ├── errorHandler.ts        # Global Express error handler
    │   ├── requestLogger.ts       # Per-request pino HTTP logger
    │   └── validate.ts            # Zod body validation middleware
    ├── nodes/
    │   ├── base.handler.ts        # Abstract base class
    │   ├── webhook.handler.ts
    │   ├── transform.handler.ts
    │   ├── condition.handler.ts
    │   ├── email.handler.ts
    │   ├── delay.handler.ts
    │   ├── ai.handler.ts
    │   └── store.handler.ts
    ├── repositories/
    │   ├── workflow.repository.ts  # DB access for workflows table
    │   └── execution.repository.ts # DB access for workflow_results table
    ├── routes/
    │   ├── workflows.routes.ts
    │   ├── webhook.routes.ts
    │   └── executions.routes.ts
    ├── services/
    │   ├── workflow.service.ts    # Workflow CRUD + validation
    │   └── execution.service.ts  # Trigger + async execution lifecycle
    ├── utils/
    │   ├── logger.ts              # Pino logger instance
    │   ├── errors.ts              # AppError subclasses
    │   ├── interpolate.ts         # {{field}} template resolver
    │   └── asyncHandler.ts        # Express async wrapper
    ├── app.ts                     # Express app factory (middleware + routes)
    ├── config.ts                  # Typed env config
    └── server.ts                  # HTTP server entry point
```

---

## Workflow Execution Engine

The engine lives in `src/engine/executor.ts`. It treats a workflow as a directed graph and walks it recursively.

### Startup

```typescript
export async function executeWorkflow(
  workflow: WorkflowDef,
  initialPayload: Record<string, unknown>,
  ctx: ExecContext
): Promise<void>
```

1. Builds an **adjacency map** (`nodeId → Edge[]`) from all edges
2. Builds a **node map** (`nodeId → NodeDef`) from all nodes
3. Finds **start nodes** — nodes whose `id` does not appear in any edge's `target`
4. Calls `executeNode()` on each start node with the initial payload

### Node execution

```typescript
async function executeNode(
  nodeId: string,
  data: Record<string, unknown>,
  adjacencyMap: Map<string, Edge[]>,
  nodeMap: Map<string, NodeDef>,
  ctx: ExecContext
): Promise<void>
```

For each node:
1. Resolves the handler from the registry by `node.type`
2. Calls `handler.run(input, config, ctx)` — records duration, input, output, status in `ctx.log`
3. Applies **routing logic** (see below) to decide which downstream nodes to call

### ExecContext

Passed through every node, accumulates the full execution log:

```typescript
interface ExecContext {
  workflowId: string;
  executionId: string;
  log: ExecLogEntry[];   // appended after each node
}
```

---

## Node Handler System

Every node type implements the `NodeHandler` interface via `BaseHandler`:

```typescript
interface NodeHandler {
  readonly type: string;
  run(
    input: Record<string, unknown>,
    config: Record<string, unknown>,
    ctx: ExecContext
  ): Promise<Record<string, unknown>>;
}
```

Handlers are registered at startup into a singleton `NodeHandlerRegistry`:

```typescript
registry.register(new WebhookHandler());
registry.register(new TransformHandler());
registry.register(new ConditionHandler());
registry.register(new EmailHandler());
registry.register(new DelayHandler());
registry.register(new AIHandler());
registry.register(new StoreHandler());
```

The registry throws a descriptive error if an unrecognised node type appears in a workflow definition.

### Handler summary

| Handler | Input → Output | Key behaviour |
|---------|---------------|---------------|
| `webhook` | payload → payload unchanged | Entry point, logs payload keys and size |
| `transform` | data → reshaped data | Renames fields (`source→target`) and injects static/template values |
| `condition` | data → data + `_branch` | Evaluates field against ordered branches; sets `_branch` to matched value or `null` |
| `email` | data → data + `email_sent/to/subject` | Sends via SMTP or logs in dev mode; supports template and AI body modes |
| `delay` | data → data unchanged | Awaits `delayMs` (max 30 s) then passes through |
| `ai` | data → data + parsed JSON | Interpolates prompt, calls LLM, merges parsed JSON response |
| `store` | data → data unchanged | Upserts `workflow_results` row with current data and log |

### Field interpolation

Any config string supports `{{fieldName}}` and `{{nested.key}}` placeholders resolved against the current node's input:

```typescript
interpolate("Hello {{user.name}}", { user: { name: "Alice" } })
// → "Hello Alice"
```

Unresolved placeholders are left as-is (`{{missingKey}}`).

---

## Branch Execution Logic

The `condition` node evaluates a named field against an ordered list of branches and sets `_branch` in its output:

```typescript
// condition.handler.ts
for (const branch of branches) {
  if (this.evaluate(fieldValue, branch.operator, branch.value)) {
    return { ...input, _branch: branch.value };
  }
}
return { ...input, _branch: null };
```

### Supported operators

| Operator | Behaviour |
|----------|-----------|
| `equals` | Strict string equality (trimmed, case-sensitive) |
| `not_equals` | String inequality |
| `contains` | Case-insensitive substring match |
| `gt` | `Number(actual) > Number(expected)` |
| `lt` | `Number(actual) < Number(expected)` |

### Edge matching

After the condition node runs, the executor looks for an outgoing edge whose `condition` property equals `_branch`:

```typescript
// executor.ts
const matchingEdge = outgoingEdges.find((e) => e.condition === branch);
if (!matchingEdge) {
  // log warn — halt this path
  return;
}
await executeNode(matchingEdge.target, output, ...);
```

**The branch `value` field is the routing key.** It doubles as:
1. The operand compared against the field value
2. The `condition` label written on the outgoing edge by `serializeFlow()` on the frontend

If `_branch` is `null` (no branch matched) or no edge carries the matched label, the path halts cleanly. The overall execution status remains `completed`.

---

## Parallel Execution Logic

All non-condition nodes fan out to every outgoing edge simultaneously using `Promise.all`:

```typescript
// executor.ts
await Promise.all(
  outgoingEdges.map((edge) =>
    executeNode(edge.target, output, adjacencyMap, nodeMap, ctx)
  )
);
```

This means a node with three downstream connections executes all three branches at the same time. Each branch receives an independent copy of the output data (JavaScript spread), so mutations in one branch do not affect another.

**Execution is fire-and-forget at the service level.** The HTTP response returns the `executionId` immediately while the async engine runs:

```typescript
// execution.service.ts
executeWorkflow(workflow.definition, payload, ctx)
  .then(async () => {
    await executionRepository.update(executionId, { status: 'completed', ... });
  })
  .catch(async (err) => {
    await executionRepository.update(executionId, { status: 'failed', ... });
  });

return { executionId }; // returned before .then/.catch resolves
```

---

## Database Schema

```prisma
model Workflow {
  id         String           @id @default(cuid())
  name       String
  definition Json             // WorkflowDef { nodes: NodeDef[], edges: Edge[] }
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
  results    WorkflowResult[]

  @@map("workflows")
}

model WorkflowResult {
  id          String   @id @default(cuid())
  workflowId  String
  executionId String   @unique
  status      String   // "running" | "completed" | "failed"
  resultJson  Json?    // output of the last node
  execLog     Json     @default("[]")  // ExecLogEntry[]
  createdAt   DateTime @default(now())

  workflow Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@index([workflowId])
  @@map("workflow_results")
}
```

The `definition` column stores the complete workflow graph (nodes + edges) as JSON. The `execLog` column stores the per-node execution log written during execution.

---

## API Endpoints

### Workflows

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/workflows` | List all workflows |
| `GET` | `/api/workflows/:id` | Get a single workflow by ID |
| `POST` | `/api/workflows` | Create a new workflow |
| `PUT` | `/api/workflows/:id` | Update workflow name and definition |
| `DELETE` | `/api/workflows/:id` | Delete a workflow and its execution history |

**Request body for POST/PUT:**
```json
{
  "name": "My Workflow",
  "definition": {
    "nodes": [ ... ],
    "edges": [ ... ]
  }
}
```

### Execution

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/workflows/:workflowId/trigger` | Trigger a workflow manually with a JSON payload |
| `POST` | `/api/webhook/:workflowId` | External webhook trigger (same as above) |
| `GET` | `/api/executions/:executionId` | Poll execution status and result |
| `GET` | `/api/workflows/:workflowId/executions` | List all executions for a workflow |

**Trigger request:**
```json
{
  "temperature": 42,
  "location": "Server Room A"
}
```

**Trigger response (202 Accepted):**
```json
{
  "data": {
    "executionId": "uuid-here",
    "status": "running",
    "pollUrl": "/api/executions/uuid-here"
  }
}
```

**Poll response (`completed`):**
```json
{
  "data": {
    "executionId": "uuid-here",
    "status": "completed",
    "resultJson": { ... },
    "execLog": [
      {
        "nodeId": "webhook-123",
        "nodeType": "webhook",
        "input": { ... },
        "output": { ... },
        "status": "success",
        "timestamp": "2025-01-01T00:00:00.000Z",
        "durationMs": 2
      }
    ]
  }
}
```

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check — returns `{ status: "ok" }` |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `DIRECT_URL` | No | — | Direct DB URL for Prisma Migrate |
| `PORT` | No | `3000` | HTTP server port |
| `NODE_ENV` | No | `development` | Affects log level and transport |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |
| `SMTP_HOST` | No | — | SMTP host (omit to enable dev console logging) |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `OPENAI_API_KEY` | No | — | OpenAI key for AI nodes |
| `GEMINI_API_KEY` | No | — | Gemini key (used if OpenAI key is absent) |

---

## Development Setup

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server (tsx watch)
npm run dev

# Open Prisma Studio (optional)
npm run db:studio
```

### Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload via `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run migrations in development |
| `npm run db:migrate:deploy` | Apply migrations in production |
| `npm run db:push` | Push schema changes without migrations |
| `npm run db:studio` | Open Prisma Studio |

---

## Logging System

All logging uses **pino** with **pino-pretty** in development. Every log line includes structured context fields for easy filtering.

### Log levels

| Level | When used |
|-------|-----------|
| `debug` | Node start, per-mapping traces, AI prompts/responses, routing decisions |
| `info` | Execution lifecycle, workflow CRUD, email sent, handler registration |
| `warn` | Condition no-match, unresolvable interpolation, AI JSON parse failure |
| `error` | Node failure, unknown node type, execution failed |

In production (`NODE_ENV=production`), pino is configured at `info` level — `debug` lines are dropped with zero overhead.

### Example log output (development)

```
10:45:01 INFO  [execution] trigger received { workflowId: "clx...", payloadKeys: ["temperature","location"] }
10:45:01 INFO  [execution] persisted as running — starting background execution { executionId: "uuid..." }
10:45:01 INFO  [executor] starting workflow execution { nodeCount: 4, edgeCount: 3, startNodes: ["webhook-123"] }
10:45:01 DEBUG [executor] starting node "webhook-123" (webhook) { inputKeys: ["temperature","location"] }
10:45:01 DEBUG [webhook] received payload { payloadSize: 64 }
10:45:01 DEBUG [executor] fanning out to 1 downstream node(s) { targets: ["transform-456"] }
10:45:01 DEBUG [transform] starting { mappingCount: 2 }
10:45:01 DEBUG [transform] renamed field { source: "temperature", target: "temp_celsius" }
10:45:01 DEBUG [transform] set field from value { target: "unit", value: "celsius" }
10:45:01 DEBUG [condition] matched { field: "temp_celsius", fieldValue: 42, matchedBranch: "35" }
10:45:01 DEBUG [executor] condition node: routing to branch target { branch: "35", target: "email-789" }
10:45:01 DEBUG [email] preparing to send { to: "ops@company.com", subject: "High Temperature Alert — Server Room A" }
10:45:01 INFO  [email] [DEV] no SMTP configured — logging only
10:45:01 INFO  [execution] completed successfully { nodeCount: 4 }
```

### Key context fields

| Field | Present in | Description |
|-------|-----------|-------------|
| `executionId` | All engine/handler logs | Correlates all logs for one run |
| `nodeId` / `nodeType` | Executor logs | Identifies which node is executing |
| `inputKeys` / `outputKeys` | Node start/end logs | Shows data shape without logging full values |
| `branch` | Condition routing logs | Which branch was matched |
| `error` | Error/failure logs | Error message for failed nodes or executions |