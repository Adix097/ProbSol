import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createRoadmapSchema } from '../validators/schemas.js';
import { findOrStartRoadmap, getRoadmapRow, toView } from '../services/roadmapService.js';
import { HttpError } from '../utils.js';

const router = Router();
router.use(requireAuth);

// Ready (cache hit) -> full roadmap. Otherwise -> { id, status }.
router.post('/', async (req, res) => {
  const { topic, goal, learner_profile: learnerProfile } = createRoadmapSchema.parse(req.body);
  const row = await findOrStartRoadmap({ user: req.user, topic, goal, learnerProfile });
  if (row.status === 'ready') return res.json(toView(row));
  res.status(202).json({ id: row.id, status: row.status });
});

router.get('/:id', async (req, res) => {
  const row = await getRoadmapRow(req.params.id);
  if (!row) throw new HttpError(404, 'Roadmap not found.');
  res.json(toView(row));
});

export default router;
