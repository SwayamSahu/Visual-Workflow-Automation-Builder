import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { executionService } from '../services/execution.service';

const router = Router();

/**
 * POST /api/workflows/:workflowId/trigger
 * Manual trigger from the UI — functionally identical to the webhook endpoint.
 */
router.post(
  '/workflows/:workflowId/trigger',
  asyncHandler(async (req, res) => {
    const workflowId = req.params.workflowId as string;
    const payload = req.body as Record<string, unknown>;

    const { executionId } = await executionService.trigger(workflowId, payload);

    res.status(202).json({
      data: {
        executionId,
        status: 'running',
        pollUrl: `/api/executions/${executionId}`,
      },
    });
  })
);

/**
 * GET /api/executions/:executionId
 * Poll execution status and result.
 */
router.get(
  '/executions/:executionId',
  asyncHandler(async (req, res) => {
    const executionId = req.params.executionId as string;
    const result = await executionService.getResult(executionId);
    res.json({ data: result });
  })
);

/**
 * GET /api/workflows/:workflowId/executions
 * List all executions for a workflow.
 */
router.get(
  '/workflows/:workflowId/executions',
  asyncHandler(async (req, res) => {
    const workflowId = req.params.workflowId as string;
    const results = await executionService.listByWorkflow(workflowId);
    res.json({ data: results });
  })
);

export default router;
