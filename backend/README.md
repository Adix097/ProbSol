# Backend (Express + Postgres)

Handles users, roadmaps and progress tracking. It never generates roadmaps itself: it asks the `ai/` service and waits for a callback.

## Setup

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, INTERNAL_KEY
npm install
npm run migrate             # creates the tables (safe to re-run)
npm run dev                 # http://localhost:4000
```

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/signup`, `/api/auth/login` | return `{ token, user }` |
| POST | `/api/roadmaps` | `{ topic, goal }`. Ready: full roadmap. Else `{ id, status }` |
| GET | `/api/roadmaps/:id` | roadmap, or `status` + empty `stages` + `error` |
| GET | `/api/roadmaps/:id/progress` | `{ roadmap_id, nodes, summary }` |
| PUT | `/api/roadmaps/:id/progress/:nodeId` | `{ status }` -> `{ node_id, status, summary }` |
| GET | `/api/me/roadmaps` | bare array for the dashboard |
| POST | `/internal/roadmaps/:id/complete` and `/fail` | AI service only (`X-Internal-Key`) |

Errors are always `{ "message": "..." }` with a proper status (400, 401, 404, 409, 429).

## How generation works

1. `POST /api/roadmaps` normalizes the topic (lowercase, collapsed spaces) and checks the cache on `(topic, goal)`.
2. Cache hit: the roadmap is linked to the user and returned. A previously `failed` one is regenerated.
3. Miss: row created as `queued`, backend calls `POST {AI_URL}/generate`, status becomes `generating`.
4. The AI service calls `/internal/.../complete` (or `/fail`). The backend assigns ids (`st_`, `nd_`, `res_`) and stores the result.
5. A watcher marks anything stuck for `GENERATION_TIMEOUT_MIN` minutes as `failed`, so nobody waits forever.
6. Users can start unlimited new generations; cache hits are still reused.

## Layout

```
src/
  app.js, server.js, config.js, db.js, migrate.js, utils.js
  routes/       auth, roadmaps, progress, me, internal   (HTTP only)
  services/     roadmapService (cache, assembly, jobs), progressService (summary math), watcher
  clients/      aiClient.js  (the only place that calls the AI service)
  middleware/   auth (JWT + internal key), errorHandler
  validators/   schemas.js   (zod: public input and AI output)
sql/schema.sql
```
