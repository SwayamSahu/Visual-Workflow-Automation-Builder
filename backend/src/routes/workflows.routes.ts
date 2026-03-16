import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { workflowService } from '../services/workflow.service';

const router = Router();

const workflowBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  definition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
});

// GET /api/workflows
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const workflows = await workflowService.list();
    res.json({ data: workflows });
  })
);

// GET /api/workflows/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const workflow = await workflowService.getById(req.params.id as string);
    res.json({ data: workflow });
  })
);

// POST /api/workflows
router.post(
  '/',
  validateBody(workflowBodySchema),
  asyncHandler(async (req, res) => {
    const { name, definition } = req.body as z.infer<typeof workflowBodySchema>;
    const workflow = await workflowService.create(name, definition as never);
    res.status(201).json({ data: workflow });
  })
);

// PUT /api/workflows/:id
router.put(
  '/:id',
  validateBody(workflowBodySchema),
  asyncHandler(async (req, res) => {
    const { name, definition } = req.body as z.infer<typeof workflowBodySchema>;
    const workflow = await workflowService.update(req.params.id as string, name, definition as never);
    res.json({ data: workflow });
  })
);

// DELETE /api/workflows/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await workflowService.delete(req.params.id as string);
    res.status(204).send();
  })
);

export default router;
