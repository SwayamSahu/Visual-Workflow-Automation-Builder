import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { executionService } from '../services/execution.service';

const router = Router();

/**
 * POST /api/webhook/:workflowId
 *
 * External webhook trigger — starts a workflow with the request body as payload.
 * Returns 202 Accepted immediately with an executionId for polling.
 */
router.post(
  '/:workflowId',
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

export default router;
