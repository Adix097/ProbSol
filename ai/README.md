# ProbSol AI integration patch

This patch replaces the fake roadmap generator in `ai/main.py` with a real pipeline:

1. TinyFish Search retrieves candidate learning resources.
2. TinyFish Fetch enriches a few results with page text.
3. Gemini creates a staged roadmap using those results.
4. The service filters out any resource URL that did not come from TinyFish.
5. The service posts the result to the existing backend callback contract (`/complete` or `/fail`).

## Apply to your repository

Copy these files into the existing `ai/` directory in `Adix097/ProbSol`, replacing `main.py`, `requirements.txt`, and `.env.example`. Keep the existing backend and frontend contracts unchanged.

## Local run (PowerShell)

```powershell
cd ai
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Edit .env and set all three secrets before continuing
uvicorn main:app --reload --port 8000
```

Open `http://127.0.0.1:8000/health`. The response should show `ok: true` and both providers configured.

## Deploy the AI service

Deploy the `ai/` directory as a long-running Python web service on Render or Railway (rather than a short-lived serverless function, because this repository uses FastAPI BackgroundTasks).

- Root directory: `ai` (if the platform supports a monorepo root directory)
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `INTERNAL_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `TINYFISH_API_KEY`

Generate one long random `INTERNAL_KEY`; use the exact same value in both AI service and backend environment variables.

## Backend environment

In the existing backend deployment, set/update:

- `AI_URL=https://YOUR-AI-SERVICE-DOMAIN` (no trailing slash)
- `INTERNAL_KEY=the-same-long-random-secret`
- `BACKEND_URL=https://YOUR-BACKEND-DOMAIN` (no trailing slash)
- `CORS_ORIGIN=https://probsol-delta.vercel.app`

Keep your existing `DATABASE_URL`, `JWT_SECRET`, and other backend variables unchanged. Redeploy/restart the backend after changing environment variables.

## Frontend environment

In the Vercel project serving `probsol-delta.vercel.app`, set:

- `VITE_API_URL=https://YOUR-BACKEND-DOMAIN` (no trailing slash)

Redeploy the frontend after changing it. Do not put Gemini or TinyFish API keys in frontend environment variables or React source code.

## Test end-to-end

1. `GET https://YOUR-AI-SERVICE-DOMAIN/health` should return `ok: true` and both providers configured.
2. Sign in to ProbSol.
3. Enter a topic and select Beginner, Intermediate, or Job ready.
4. Generate a roadmap and wait for the existing generating page to poll until the backend receives the callback.
5. Confirm resources open and are relevant. URLs are restricted to TinyFish search results; if no usable source is found for a node, the node is marked as having limited resources.

The existing app architecture has an async callback workflow. Do not replace it with a new Express server or change the callback JSON schema.
