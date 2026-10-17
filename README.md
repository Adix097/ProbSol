# ProbSol

ProbSol turns a learning goal into a practical roadmap. A roadmap is built around the learner's experience, available time, and intended outcome, then broken into topics, resources, and hands-on projects.

The repository contains three parts:

- `frontend/` - the React application.
- `backend/` - the Express API, PostgreSQL integration, authentication, progress tracking, and generation callbacks.
- `ai/` - the FastAPI service that searches for resources and asks an LLM to assemble the roadmap.

> The commands in this README are written for bash.

## How the services fit together

The browser talks to the backend. When a user requests a roadmap, the backend creates a queued record and asks the AI service to work on it. The AI service searches for learning material, generates the roadmap, and calls the backend when it is finished. The browser then polls the roadmap until it is ready.

PostgreSQL stores users, roadmaps, user-roadmap links, generation attempts, and progress. Roadmaps are shared only when their topic, goal, and learner profile match.

## Local setup

You need Node.js, Python 3, PostgreSQL, and the credentials for the AI providers used by the service.

### 1. Configure the AI service

```bash
cd ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set the values in `ai/.env`, especially `INTERNAL_KEY`, `GEMINI_API_KEY`, and `TINYFISH_API_KEY`. The same `INTERNAL_KEY` must be used by the backend.

Start it with:

```bash
uvicorn main:app --reload --port 8000
```

Check that it is running:

```bash
curl http://localhost:8000/health
```

### 2. Configure the backend

Create `backend/.env` from the example and set `DATABASE_URL`, `JWT_SECRET`, and `INTERNAL_KEY`.

For local development, these values are normally enough:

```dotenv
PORT=4000
AI_URL=http://localhost:8000
BACKEND_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Install dependencies, create or update the database, and start the API:

```bash
cd backend
npm install
npm run migrate
npm run dev
```

The API runs at `http://localhost:4000`.

### 3. Start the frontend

In a third terminal:

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:4000 npm run dev -- --port 5173
```

Open `http://localhost:5173`.

The local Vite proxy also points `/api` to `http://localhost:4000`. Setting `VITE_API_URL` explicitly makes the target clear and avoids accidentally testing against a deployed backend.

## Checking the local build

These checks do not create a commit or push anything:

```bash
python3 -m py_compile ai/main.py
node --check backend/src/utils.js
node --check backend/src/validators/schemas.js
node --check backend/src/clients/aiClient.js
node --check backend/src/services/roadmapService.js
npm --prefix frontend run build
git diff --check
```

For a full manual check, sign up, create a roadmap with a learner profile, wait for generation, open a resource, inspect a project brief, update progress, refresh the page, and try the same topic with a different profile.

## Deployment

Deploy the services separately. The AI service should run as a long-lived FastAPI process because generation uses a background task and calls the backend later. The backend needs PostgreSQL and the URL of the deployed AI service. The frontend needs `VITE_API_URL` set to the public backend URL.

Keep provider keys and `INTERNAL_KEY` on the server side. They should never be placed in React source code or frontend environment variables.