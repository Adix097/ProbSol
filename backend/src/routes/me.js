import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { computeSummary } from '../services/progressService.js';
import { HttpError } from '../utils.js';

const router = Router();
router.use(requireAuth);

router.delete('/roadmaps/:id', async (req, res) => {
  const { rowCount } = await query(
    'DELETE FROM user_roadmaps WHERE user_id = $1 AND roadmap_id = $2',
    [req.user.id, req.params.id],
  );
  if (!rowCount) throw new HttpError(404, 'Roadmap not found in your roadmaps.');
  res.status(204).end();
});

router.get('/roadmaps', async (req, res) => {
  const [roadmaps, progress] = await Promise.all([
    query(
      `SELECT r.id, r.topic, r.goal, r.status, r.content
       FROM user_roadmaps ur JOIN roadmaps r ON r.id = ur.roadmap_id
       WHERE ur.user_id = $1 ORDER BY ur.created_at DESC`,
      [req.user.id],
    ),
    query('SELECT roadmap_id, node_id, status FROM progress WHERE user_id = $1', [req.user.id]),
  ]);

  const byRoadmap = {};
  for (const p of progress.rows) (byRoadmap[p.roadmap_id] ||= {})[p.node_id] = { status: p.status };

  res.json(roadmaps.rows.map((r) => {
    const s = computeSummary(r.status === 'ready' ? r.content : null, byRoadmap[r.id] || {});
    return {
      id: r.id,
      topic: r.topic,
      goal: r.goal,
      status: r.status,
      percent_complete: s.percent_complete,
      completed_nodes: s.completed_nodes,
      total_nodes: s.total_nodes,
    };
  }));
});

export default router;
