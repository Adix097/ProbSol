import { failStaleRoadmaps } from './roadmapService.js';

export function startWatcher() {
  const tick = () => failStaleRoadmaps().catch((e) => console.error('Watcher error:', e.message));
  tick();
  return setInterval(tick, 60_000);
}
