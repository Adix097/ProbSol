// Called ONLY by the AI service
import { Router } from 'express';
import { requireInternalKey } from '../middleware/auth.js';
import { aiCompleteSchema, aiFailSchema } from '../validators/schemas.js';
import { completeRoadmap, failRoadmap } from '../services/roadmapService.js';

const router = Router();
router.use(requireInternalKey);

router.post('/roadmaps/:id/complete', async (req, res) => {
  const data = aiCompleteSchema.parse(req.body);
  await completeRoadmap(req.params.id, data);
  res.json({ ok: true });
});

router.post('/roadmaps/:id/fail', async (req, res) => {
  const { error } = aiFailSchema.parse(req.body ?? {});
  await failRoadmap(req.params.id, error);
  res.json({ ok: true });
});

export default router;
