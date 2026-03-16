import { WorkflowDef, NodeDef, Edge, ExecContext, ExecLogEntry } from './types';
import { registry } from './registry';
import { logger } from '../utils/logger';

// ─── Graph Helpers ────────────────────────────────────────────────────────────

function buildAdjacencyMap(edges: Edge[]): Map<string, Edge[]> {
  const map = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (!map.has(edge.source)) map.set(edge.source, []);
    map.get(edge.source)!.push(edge);
  }
  return map;
}

function buildNodeMap(nodes: NodeDef[]): Map<string, NodeDef> {
  const map = new Map<string, NodeDef>();
  for (const node of nodes) map.set(node.id, node);
  return map;
}

// ─── Node Execution ───────────────────────────────────────────────────────────

async function executeNode(
  nodeId: string,
  data: Record<string, unknown>,
  adjacencyMap: Map<string, Edge[]>,
  nodeMap: Map<string, NodeDef>,
  ctx: ExecContext
): Promise<void> {
  const node = nodeMap.get(nodeId);
  if (!node) {
    logger.warn({ nodeId }, 'Node not found in workflow definition — skipping');
    return;
  }

  const handler = registry.get(node.type);
  const startMs = Date.now();
  let output: Record<string, unknown>;

  logger.debug(
    {
      executionId: ctx.executionId,
      nodeId,
      nodeType: node.type,
      inputKeys: Object.keys(data),
    },
    `[executor] starting node "${nodeId}" (${node.type})`
  );

  try {
    output = await handler.run(data, node.config ?? {}, ctx);

    const entry: ExecLogEntry = {
      nodeId,
      nodeType: node.type,
      input: data,
      output,
      status: 'success',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startMs,
    };
    ctx.log.push(entry);

    logger.info(
      {
        nodeId,
        nodeType: node.type,
        durationMs: entry.durationMs,
        outputKeys: Object.keys(output),
        output,
      },
      `[${node.type}] node "${nodeId}" completed`
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    const entry: ExecLogEntry = {
      nodeId,
      nodeType: node.type,
      input: data,
      output: {},
      status: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startMs,
    };
    ctx.log.push(entry);

    logger.error(
      { nodeId, nodeType: node.type, error: errorMessage },
      `[${node.type}] node "${nodeId}" FAILED`
    );
    throw err;
  }

  // ─── Routing Logic ─────────────────────────────────────────────────────────
  const outgoingEdges = adjacencyMap.get(nodeId) ?? [];

  if (node.type === 'condition') {
    // Condition node: follow only the branch matching _branch value
    const branch = output._branch as string | null | undefined;

    if (!branch) {
      logger.warn({ nodeId }, 'Condition node produced no _branch — halting path');
      return;
    }

    const matchingEdge = outgoingEdges.find((e) => e.condition === branch);
    if (!matchingEdge) {
      logger.warn(
        { executionId: ctx.executionId, nodeId, branch, availableEdges: outgoingEdges.map((e) => e.condition) },
        '[executor] condition node: no matching edge for branch — halting path'
      );
      return;
    }

    logger.debug(
      { executionId: ctx.executionId, nodeId, branch, target: matchingEdge.target },
      '[executor] condition node: routing to branch target'
    );
    await executeNode(matchingEdge.target, output, adjacencyMap, nodeMap, ctx);
  } else {
    // Standard node: fan-out to all downstream nodes in parallel
    if (outgoingEdges.length > 0) {
      logger.debug(
        {
          executionId: ctx.executionId,
          nodeId,
          nodeType: node.type,
          targets: outgoingEdges.map((e) => e.target),
        },
        `[executor] fanning out to ${outgoingEdges.length} downstream node(s)`
      );
    }
    await Promise.all(
      outgoingEdges.map((edge) =>
        executeNode(edge.target, output, adjacencyMap, nodeMap, ctx)
      )
    );
  }
}

// ─── Public Entry Point ───────────────────────────────────────────────────────

export async function executeWorkflow(
  workflow: WorkflowDef,
  initialPayload: Record<string, unknown>,
  ctx: ExecContext
): Promise<void> {
  const adjacencyMap = buildAdjacencyMap(workflow.edges);
  const nodeMap = buildNodeMap(workflow.nodes);

  // Start nodes = nodes with no incoming edges
  const targetNodeIds = new Set(workflow.edges.map((e) => e.target));
  const startNodes = workflow.nodes.filter((n) => !targetNodeIds.has(n.id));

  if (workflow.nodes.length === 0) {
    throw new Error(
      'Workflow has no nodes. Add nodes to the canvas and save the workflow before running.'
    );
  }

  if (startNodes.length === 0) {
    throw new Error(
      'No start node found — every node has an incoming edge. Check for cycles or add a Webhook node as the entry point.'
    );
  }

  logger.info(
    {
      executionId: ctx.executionId,
      workflowId: ctx.workflowId,
      nodeCount: workflow.nodes.length,
      edgeCount: workflow.edges.length,
      startNodes: startNodes.map((n) => n.id),
    },
    '[executor] starting workflow execution'
  );

  // Execute all start nodes in parallel (typically just one webhook trigger)
  await Promise.all(
    startNodes.map((node) =>
      executeNode(node.id, initialPayload, adjacencyMap, nodeMap, ctx)
    )
  );
}
