# Frontend

The frontend is a React application built with Vite. It handles sign-up and login, roadmap requests, generation status, roadmap display, and progress updates. The backend remains responsible for authentication, storage, generation, and progress calculations.

## Run locally

From this directory:

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:4000 npm run dev -- --port 5173
```

Open `http://localhost:5173` in your browser.

`VITE_API_URL` tells the frontend where to send API requests. During local development it should point to the local backend. The Vite development proxy also sends `/api` requests to `http://localhost:4000` when no explicit API URL is provided.

The backend must be running separately, and its CORS configuration must allow the frontend origin:

```dotenv
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

## Build for production

```bash
npm run build
```

The compiled files are written to `dist/`. To preview that build locally:

```bash
npm run preview
```

For a deployed frontend, set `VITE_API_URL` to the public backend URL before building. Do not put Gemini, TinyFish, database, JWT, or internal service keys in frontend environment variables.

## Main screens

- Home: collects a topic, goal, experience level, weekly time, and target outcome.
- Login and signup: manage the user's session.
- Dashboard: lists the user's roadmaps and completion status.
- Generating: polls the backend while a roadmap is being created.
- Roadmap: displays stages, resources, project briefs, and progress controls.

## Source layout

```text
src/
  App.jsx, main.jsx, index.css
  components/       reusable navigation, auth, resource, and status components
  pages/            application screens
  services/         API requests and authentication state
```

The API functions live in `src/services/api.js`. Components should use that API layer rather than calling `fetch` directly.

## Local checks

```bash
npm run build
git diff --check
```
