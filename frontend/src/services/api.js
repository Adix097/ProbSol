// ─────────────────────────────────────────────────────────────
// API layer. Flip USE_MOCK_DATA to false to talk to the real backend.
// Every page imports from here only, so nothing else needs to change.
// ─────────────────────────────────────────────────────────────
export const USE_MOCK_DATA = true;
const BASE_URL = import.meta.env.VITE_API_URL || ''; // '' = same origin (Vite proxy)

export const GOALS = [
  { value: 'beginner', label: 'Beginner', blurb: 'Start from zero and build the basics.' },
  { value: 'intermediate', label: 'Intermediate', blurb: 'Fill gaps and go deeper.' },
  { value: 'job_ready', label: 'Job ready', blurb: 'Skills and projects employers look for.' },
];
export const goalLabel = (v) => GOALS.find((g) => g.value === v)?.label ?? v;

/** Where to send the user after POST /api/roadmaps. */
export const roadmapPath = (res) =>
  res.status === 'ready' ? `/roadmaps/${res.id}` : `/roadmaps/${res.id}/generating`;

// ───────── Real backend ─────────
async function http(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('probsol_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { msg = (await res.json()).message || msg; } catch { /* non-JSON error body */ }
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

const real = {
  login: (email, password) => http('/api/auth/login', { method: 'POST', body: { email, password } }),
  signup: (name, email, password) => http('/api/auth/signup', { method: 'POST', body: { name, email, password } }),
  createRoadmap: (payload) => http('/api/roadmaps', { method: 'POST', body: payload }),
  getRoadmap: (id) => http(`/api/roadmaps/${id}`),
  getProgress: (id) => http(`/api/roadmaps/${id}/progress`),
  // ASSUMED endpoint – adjust to whatever your backend exposes for status changes.
  updateNodeStatus: (id, nodeId, status) =>
    http(`/api/roadmaps/${id}/progress/${nodeId}`, { method: 'PUT', body: { status } }),
  getMyRoadmaps: () => http('/api/me/roadmaps'),
};

// ───────── Mock backend ─────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// [stage title, description, nodes]; node = [type, title, description, resources, limited?]
// resource = [title, source, type, duration_minutes]
const CONTENT = [
  ['Foundations', 'The basic tools you need before studying any data structure.', [
    ['topic', 'Time and Space Complexity', 'Learn Big-O notation and how to analyze simple code.',
      [['Big O Notation Explained Visually', 'YouTube', 'video', 28], ['Big-O Cheat Sheet and Guide', 'freeCodeCamp', 'article', 15]]],
    ['topic', 'Arrays and Strings', 'Indexing, traversal, two-pointer and sliding window basics.',
      [['Arrays and Strings Crash Course', 'YouTube', 'video', 90], ['Array Problems by Pattern', 'GitHub', 'repo', null]]],
  ]],
  ['Core Data Structures', 'The structures that appear in almost every problem.', [
    ['topic', 'Linked Lists', 'Singly and doubly linked lists, insertion, deletion, reversal.',
      [['Linked Lists from Scratch', 'YouTube', 'video', 45], ['Linked List Visualizer', 'VisuAlgo', 'interactive', null]]],
    ['topic', 'Stacks and Queues', 'LIFO and FIFO structures, with typical use cases.',
      [['Stacks and Queues Explained', 'MIT OpenCourseWare', 'course', 120], ['Stack and Queue Problems', 'GeeksforGeeks', 'article', 20]]],
    ['topic', 'Hash Tables', 'Hash functions, collisions, and when to use maps and sets.',
      [['How Hash Tables Work', 'YouTube', 'video', 22], ['Hash Maps in Practice', 'MDN', 'docs', 12], ['Implement Your Own Hash Map', 'GitHub', 'repo', null]]],
    ['project', 'Mini project: Build an LRU Cache', 'Combine a hash map and a doubly linked list for constant-time operations.', []],
  ]],
  ['Recursion, Sorting and Searching', 'Thinking recursively and organizing data efficiently.', [
    ['topic', 'Recursion and Backtracking', 'Base cases, call stacks, and exploring choices.',
      [['Recursion for Beginners', 'YouTube', 'video', 35], ['Backtracking Patterns', 'freeCodeCamp', 'article', 18]]],
    ['topic', 'Sorting and Binary Search', 'Merge sort, quicksort, and binary search trade-offs.',
      [['Sorting Algorithms Visualized', 'VisuAlgo', 'interactive', null], ['Binary Search Done Right', 'YouTube', 'video', 16]]],
    ['project', 'Mini project: Sorting visualizer', 'Animate two sorting algorithms and show step counts.', []],
  ]],
  ['Trees, Graphs and Dynamic Programming', 'Non-linear structures and optimization techniques.', [
    ['topic', 'Trees and Binary Search Trees', 'Tree traversals, BST operations, and balance.',
      [['Binary Trees Full Course', 'YouTube', 'video', 150], ['Tree Problems Handbook', 'GitHub', 'repo', null]]],
    ['topic', 'Graphs: BFS and DFS', 'Graph representations and the two core traversals.',
      [['Graph Algorithms for Beginners', 'YouTube', 'video', 60], ['Graph Theory Notes', 'MIT OpenCourseWare', 'book', null]]],
    ['project', 'Mini project: Maze solver', 'Represent a maze as a graph and solve it with BFS and DFS.', [], true],
  ]],
];

function buildRoadmap(id, topic, goal) {
  let n = 0, r = 100;
  const stages = CONTENT.map(([title, description, nodes], si) => ({
    id: `st_${si + 1}`, order: si + 1, title, description,
    nodes: nodes.map(([type, ntitle, ndesc, resources, limited], ni) => ({
      id: `nd_${++n}`, order: ni + 1, type, title: ntitle, description: ndesc,
      limited_resources: !!limited,
      resources: resources.map(([t, source, rtype, dur]) => ({
        id: `res_${++r}`, title: t, url: 'https://example.com', source, type: rtype, duration_minutes: dur,
      })),
    })),
  }));
  return {
    id, topic, goal, status: 'ready', version: 1, generated_at: new Date().toISOString(), error: '',
    summary: `A ${goalLabel(goal).toLowerCase()} path through ${topic}, from core ideas to hands-on projects.`,
    stages,
  };
}

// The mock "backend" computes summaries so the UI never has to.
function buildProgress(rm) {
  const saved = read('probsol_mock_progress', {})[rm.id] || {};
  const all = rm.stages.flatMap((s) => s.nodes);
  const st = (n) => saved[n.id]?.status || 'not_started';
  const stages = {};
  rm.stages.forEach((s) => {
    const done = s.nodes.filter((n) => st(n) === 'completed').length;
    stages[s.id] = { completed: done, total: s.nodes.length, percent: Math.round((done / s.nodes.length) * 100) };
  });
  const completed = all.filter((n) => st(n) === 'completed').length;
  const next = all.find((n) => st(n) === 'in_progress') || all.find((n) => st(n) !== 'completed');
  return {
    roadmap_id: rm.id, nodes: saved,
    summary: {
      total_nodes: all.length, completed_nodes: completed,
      in_progress_nodes: all.filter((n) => st(n) === 'in_progress').length,
      percent_complete: Math.round((completed / all.length) * 100),
      next_node_id: next ? next.id : null, stages,
    },
  };
}

// Mock store: { [id]: { topic, goal, createdAt } }. A seeded roadmap is always ready.
const store = () => ({ rm_dsa_int_01: { topic: 'Data Structures and Algorithms', goal: 'intermediate', createdAt: 0 }, ...read('probsol_mock_rms', {}) });
const mockStatus = (rec) => {
  const age = Date.now() - rec.createdAt;
  if (/fail/i.test(rec.topic) && age > 6000) return 'failed'; // type "fail" as the topic to test the error state
  return age < 3000 ? 'queued' : age < 10000 ? 'generating' : 'ready';
};
const mockView = (id, rec) => {
  const status = mockStatus(rec);
  if (status === 'ready') return buildRoadmap(id, rec.topic, rec.goal);
  return { id, topic: rec.topic, goal: rec.goal, status, version: 1, generated_at: '', summary: '', stages: [],
    error: status === 'failed' ? 'We could not generate this roadmap. Please try again.' : '' };
};

const mock = {
  async login(email) { await sleep(400); return { token: 'mock-token', user: { id: 'u_1', name: email.split('@')[0], email } }; },
  async signup(name, email) { await sleep(400); return { token: 'mock-token', user: { id: 'u_1', name, email } }; },
  async createRoadmap({ topic, goal }) {
    await sleep(500);
    const hit = Object.entries(store()).find(([, r]) => r.topic.toLowerCase() === topic.toLowerCase() && r.goal === goal && mockStatus(r) !== 'failed');
    if (hit) { const v = mockView(hit[0], hit[1]); return v.status === 'ready' ? v : { id: v.id, status: v.status }; }
    const id = `rm_${Math.random().toString(36).slice(2, 8)}`;
    write('probsol_mock_rms', { ...read('probsol_mock_rms', {}), [id]: { topic, goal, createdAt: Date.now() } });
    return { id, status: 'queued' };
  },
  async getRoadmap(id) {
    await sleep(250);
    const rec = store()[id];
    if (!rec) throw new Error('Roadmap not found.');
    return mockView(id, rec);
  },
  async getProgress(id) {
    const rm = await mock.getRoadmap(id);
    return buildProgress(rm);
  },
  async updateNodeStatus(id, nodeId, status) {
    const all = read('probsol_mock_progress', {});
    all[id] = { ...all[id], [nodeId]: { status, updated_at: new Date().toISOString() } };
    write('probsol_mock_progress', all);
    return { node_id: nodeId, status };
  },
  async getMyRoadmaps() {
    await sleep(300);
    return Object.entries(store()).map(([id, rec]) => {
      const v = mockView(id, rec);
      const s = v.status === 'ready' ? buildProgress(v).summary : null;
      return { id, topic: rec.topic, goal: rec.goal, status: v.status,
        percent_complete: s?.percent_complete ?? 0, completed_nodes: s?.completed_nodes ?? 0, total_nodes: s?.total_nodes ?? 0 };
    });
  },
};

const impl = USE_MOCK_DATA ? mock : real;
export const login = (...a) => impl.login(...a);
export const signup = (...a) => impl.signup(...a);
export const createRoadmap = (p) => impl.createRoadmap(p);
export const getRoadmap = (id) => impl.getRoadmap(id);
export const getProgress = (id) => impl.getProgress(id);
export const updateNodeStatus = (id, nodeId, s) => impl.updateNodeStatus(id, nodeId, s);
export const getMyRoadmaps = () => impl.getMyRoadmaps();
