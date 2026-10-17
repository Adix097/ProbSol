# Backend

The backend is a small Express API backed by PostgreSQL. It owns authentication, roadmap records, user-roadmap links, progress, and the callback used by the AI service. It does not generate content itself.

## Run locally

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

Set `DATABASE_URL`, `JWT_SECRET`, and `INTERNAL_KEY` in `.env`. For the local AI service, use:

```dotenv
AI_URL=http://localhost:8000
BACKEND_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

The API listens on `http://localhost:4000` by default. `npm run migrate` is safe to run again and also adds the learner-profile columns to an older database.

## Roadmap request

`POST /api/roadmaps` requires authentication. The request body is:

```json
{
  "topic": "Python",
  "goal": "job_ready",
  "learner_profile": {
    "experience": "some_experience",
    "weekly_hours": 6,
    "target": "Build a portfolio API"
  }
}
```

The goal must be `beginner`, `intermediate`, or `job_ready`. A ready cache hit returns the complete roadmap. A new request returns `202` with an id and status while generation runs.

Roadmaps are cached by normalized topic, goal, and learner profile. This keeps equivalent requests efficient without giving every learner the same plan.

## Public endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup` | Create an account and return a token. |
| `POST` | `/api/auth/login` | Sign in and return a token. |
| `POST` | `/api/roadmaps` | Find or start a roadmap. |
| `GET` | `/api/roadmaps/:id` | Read roadmap status or content. |
| `GET` | `/api/roadmaps/:id/progress` | Read node and summary progress. |
| `PUT` | `/api/roadmaps/:id/progress/:nodeId` | Set a node to `in_progress` or `completed`. |
| `GET` | `/api/me/roadmaps` | List roadmaps linked to the signed-in user. |
| `DELETE` | `/api/me/roadmaps/:id` | Remove a roadmap from the user's list. |

Errors use the form `{ "message": "..." }` and normally return `400`, `401`, `404`, `409`, or `429`.

## Generation lifecycle

1. The API normalizes the topic and learner profile, then checks PostgreSQL for a matching roadmap.
2. A cache hit is linked to the current user and returned. Failed records may be queued again.
3. For a miss, the backend creates a `queued` record and calls the AI service at `POST /generate`.
4. The status changes to `generating` while the AI service searches and creates the roadmap.
5. The AI service calls the internal `complete` or `fail` callback.
6. The backend validates the callback, assigns stage, node, and resource ids, and stores the result.
7. The watcher marks jobs older than `GENERATION_TIMEOUT_MIN` as failed.

The internal callbacks require the shared `INTERNAL_KEY` and should not be exposed as public application endpoints.

## Roadmap content

Topic nodes contain up to three validated resources. Project nodes contain no resource links but may include a deliverable, requirements, milestones, acceptance criteria, and stretch goals. The backend assigns ids and ordering rather than trusting ids from the AI service.

## Source layout

```text
src/
  app.js, server.js, config.js, db.js, migrate.js, utils.js
  clients/      AI service client
  middleware/   authentication and error handling
  routes/       auth, roadmaps, progress, me, internal
  services/     roadmap assembly, progress, and stale-job watcher
  validators/   public and AI callback schemas
sql/schema.sql
```
