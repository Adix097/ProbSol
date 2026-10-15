import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { progressUpdateSchema } from '../validators/schemas.js';
import { getRoadmapRow } from '../services/roadmapService.js';
import { allNodes, computeSummary, getNodeMap } from '../services/progressService.js';
import { HttpError } from '../utils.js';

const router = Router();
router.use(requireAuth);

async function loadRoadmap(id) {
  const row = await getRoadmapRow(id);
  if (!row) throw new HttpError(404, 'Roadmap not found.');
  return row;
}

router.get('/:id/progress', async (req, res) => {
  const row = await loadRoadmap(req.params.id);
  const nodes = await getNodeMap(req.user.id, row.id);
  res.json({ roadmap_id: row.id, nodes, summary: computeSummary(row.content, nodes) });
});

router.put('/:id/progress/:nodeId', async (req, res) => {
  const { status } = progressUpdateSchema.parse(req.body);
  const row = await loadRoadmap(req.params.id);
  if (row.status !== 'ready') throw new HttpError(409, 'This roadmap is not ready yet.');
  const { nodeId } = req.params;
  if (!allNodes(row.content).some((n) => n.id === nodeId)) throw new HttpError(404, 'Step not found in this roadmap.');

  if (status === 'not_started') {
    await query('DELETE FROM progress WHERE user_id = $1 AND roadmap_id = $2 AND node_id = $3', [req.user.id, row.id, nodeId]);
  } else {
    await query(
      `INSERT INTO progress (user_id, roadmap_id, node_id, status) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, roadmap_id, node_id) DO UPDATE SET status = EXCLUDED.status, updated_at = now()`,
      [req.user.id, row.id, nodeId, status],
    );
  }
  // Tracking progress means the roadmap belongs in the user's list.
  await query('INSERT INTO user_roadmaps (user_id, roadmap_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, row.id]);

  const nodes = await getNodeMap(req.user.id, row.id);
  res.json({ node_id: nodeId, status, summary: computeSummary(row.content, nodes) });
});

export default router;
