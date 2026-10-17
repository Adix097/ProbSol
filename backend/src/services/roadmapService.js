import { query } from '../db.js';
import { config } from '../config.js';
import { requestGeneration } from '../clients/aiClient.js';
import { HttpError, learnerProfileKey, newRoadmapId, normalizeLearnerProfile, normalizeTopic } from '../utils.js';

export async function getRoadmapRow(id) {
  const { rows } = await query('SELECT * FROM roadmaps WHERE id = $1', [id]);
  return rows[0] || null;
}

// DB row -> the JSON the frontend expects from GET /api/roadmaps/:id
export function toView(row) {
  const ready = row.status === 'ready' && row.content;
  return {
    id: row.id,
    topic: row.topic,
    goal: row.goal,
    status: row.status,
    version: row.version,
    generated_at: ready && row.generated_at ? row.generated_at.toISOString() : '',
    error: row.status === 'failed' ? row.error || 'We could not generate this roadmap. Please try again.' : '',
    summary: ready ? row.content.summary : '',
    stages: ready ? row.content.stages : [],
  };
}

async function startGeneration(row, userId) {
  const log = await query(
    'INSERT INTO generation_log (user_id, roadmap_id) VALUES ($1, $2) RETURNING id',
    [userId, row.id],
  );
  try {
    await requestGeneration({ roadmapId: row.id, topic: row.topic, goal: row.goal, learnerProfile: row.learner_profile });
    // The AI service may already have finished; only move queued -> generating.
    await query(`UPDATE roadmaps SET status = 'generating' WHERE id = $1 AND status = 'queued'`, [row.id]);
  } catch (err) {
    console.error('AI service request failed:', err.message);
    await failRoadmap(row.id, 'The roadmap generator is unavailable right now. Please try again in a minute.');
    // Not the user's fault, so do not count it against their daily limit.
    await query('DELETE FROM generation_log WHERE id = $1', [log.rows[0].id]);
  }
}

// Cache hit -> return the existing roadmap. Miss (or previous failure) -> start generation.
// Always links the roadmap to the user so it shows up in "My roadmaps".
export async function findOrStartRoadmap({ user, topic, goal, learnerProfile }) {
  const normalized = normalizeTopic(topic);
  const normalizedProfile = normalizeLearnerProfile(learnerProfile);
  const profileKey = learnerProfileKey(normalizedProfile);
  const find = () =>
    query('SELECT * FROM roadmaps WHERE normalized_topic = $1 AND goal = $2 AND profile_key = $3', [normalized, goal, profileKey]).then((r) => r.rows[0]);

  let row = await find();
  let startNew = false;

  if (!row || row.status === 'failed') {
    if (!row) {
      const ins = await query(
        `INSERT INTO roadmaps (id, normalized_topic, topic, goal, profile_key, learner_profile, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'queued')
         ON CONFLICT (normalized_topic, goal, profile_key) DO NOTHING RETURNING *`,
        [newRoadmapId(), normalized, topic, goal, profileKey, JSON.stringify(normalizedProfile)],
      );
      if (ins.rows[0]) { row = ins.rows[0]; startNew = true; } else { row = await find(); }
    } else {
      const upd = await query(
        `UPDATE roadmaps SET status = 'queued', error = '', started_at = now()
         WHERE id = $1 AND status = 'failed' RETURNING *`,
        [row.id],
      );
      if (upd.rows[0]) { row = upd.rows[0]; startNew = true; } else { row = await find(); }
    }
  }

  await query(
    'INSERT INTO user_roadmaps (user_id, roadmap_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [user.id, row.id],
  );

  if (startNew) {
    await startGeneration(row, user.id);
    row = await getRoadmapRow(row.id);
  }
  return row;
}

// AI output (no ids) -> stored content (ids, order, rules enforced by backend, not the LLM).
export function assembleContent(data) {
  let nodeNo = 0;
  let resNo = 0;
  const stages = data.stages.map((s, si) => ({
    id: `st_${si + 1}`,
    order: si + 1,
    title: s.title,
    description: s.description,
    nodes: s.nodes.map((n, ni) => {
      const isProject = n.type === 'project';
      const resources = isProject ? [] : n.resources.slice(0, 3);
      return {
        id: `nd_${++nodeNo}`,
        order: ni + 1,
        type: n.type,
        title: n.title,
        description: n.description,
        limited_resources: isProject ? false : n.limited_resources || resources.length === 0,
        resources: resources.map((r) => ({
          id: `res_${++resNo}`,
          title: r.title,
          url: r.url,
          source: r.source,
          type: r.type,
          duration_minutes: r.duration_minutes,
        })),
        project: n.project || null,
      };
    }),
  }));
  return { summary: data.summary, stages };
}

export async function completeRoadmap(id, aiData) {
  const content = assembleContent(aiData);
  const { rowCount } = await query(
    `UPDATE roadmaps SET status = 'ready', content = $2, error = '', generated_at = now()
     WHERE id = $1 AND status IN ('queued', 'generating')`,
    [id, JSON.stringify(content)],
  );
  if (!rowCount) throw new HttpError(409, 'This roadmap is not waiting for a result.');
}

export async function failRoadmap(id, message) {
  await query(
    `UPDATE roadmaps SET status = 'failed', error = $2 WHERE id = $1 AND status IN ('queued', 'generating')`,
    [id, message || 'We could not generate this roadmap. Please try again.'],
  );
}

// Safety net
export async function failStaleRoadmaps() {
  const { rowCount } = await query(
    `UPDATE roadmaps SET status = 'failed', error = 'Generation took too long. Please try again.'
     WHERE status IN ('queued', 'generating') AND started_at < now() - make_interval(mins => $1)`,
    [config.generationTimeoutMin],
  );
  if (rowCount) console.warn(`Marked ${rowCount} stale roadmap(s) as failed.`);
}
