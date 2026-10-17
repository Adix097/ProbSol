import { config } from '../config.js';

// The ONLY place that talks to the AI service.
// The AI service answers 202 immediately and later calls our /internal endpoints.
export async function requestGeneration({ roadmapId, topic, goal, learnerProfile }) {
  const res = await fetch(`${config.aiUrl}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Key': config.internalKey },
    body: JSON.stringify({
      roadmap_id: roadmapId,
      topic,
      goal,
      learner_profile: learnerProfile,
      callback_url: `${config.backendUrl}/internal/roadmaps/${roadmapId}`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`AI service responded with ${res.status}`);
}
