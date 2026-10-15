import { query } from '../db.js';

export const allNodes = (content) => (content ? content.stages.flatMap((s) => s.nodes) : []);

// { nodeId: { status, updated_at } } for one user + roadmap
export async function getNodeMap(userId, roadmapId) {
  const { rows } = await query(
    'SELECT node_id, status, updated_at FROM progress WHERE user_id = $1 AND roadmap_id = $2',
    [userId, roadmapId],
  );
  return Object.fromEntries(rows.map((r) => [r.node_id, { status: r.status, updated_at: r.updated_at.toISOString() }]));
}

export function computeSummary(content, nodeMap) {
  const status = (n) => nodeMap[n.id]?.status || 'not_started';
  const nodes = allNodes(content);
  const completed = nodes.filter((n) => status(n) === 'completed').length;
  const next = nodes.find((n) => status(n) === 'in_progress') || nodes.find((n) => status(n) !== 'completed');

  const stages = {};
  for (const s of content?.stages || []) {
    const done = s.nodes.filter((n) => status(n) === 'completed').length;
    stages[s.id] = { completed: done, total: s.nodes.length, percent: Math.round((done / s.nodes.length) * 100) };
  }

  return {
    total_nodes: nodes.length,
    completed_nodes: completed,
    in_progress_nodes: nodes.filter((n) => status(n) === 'in_progress').length,
    percent_complete: nodes.length ? Math.round((completed / nodes.length) * 100) : 0,
    next_node_id: next ? next.id : null,
    stages,
  };
}
