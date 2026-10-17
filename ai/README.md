# AI service

The AI service is a FastAPI application that prepares roadmap content for the backend. It does not talk to users directly. The backend sends a generation request, and this service calls the backend later with either a completed roadmap or a failure.

## What happens during generation

1. TinyFish Search looks for several kinds of material: official references, courses and exercises, practice problems, debugging material, and portfolio or deployment projects.
2. Results are deduplicated and scored. Known educational and official domains receive a higher score.
3. TinyFish Fetch adds a short page excerpt to the best candidates when it can.
4. Gemini is asked to build a prerequisite-first roadmap using the topic, goal, learner profile, and retrieved results.
5. Grok is used only when Gemini fails and its key is configured.
6. The service removes malformed output, invented URLs, invalid resource types, and excessive resource reuse.
7. The finished result is posted to the backend's internal `complete` callback.

The model creates the learning structure, but it cannot invent resource URLs. Every attached resource must have come from the search results.

## Local setup

```bash
cd ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set these values in `.env`:

```dotenv
INTERNAL_KEY=the-same-value-used-by-the-backend
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-flash-latest
TINYFISH_API_KEY=your-tinyfish-key
```

`XAI_API_KEY` and `XAI_MODEL` are optional fallback settings. The service can use Gemini as its primary provider without them.

Start the service from the `ai/` directory:

```bash
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Check its status:

```bash
curl http://localhost:8000/health
```

The response reports whether the Gemini, Grok, and TinyFish credentials are configured. It does not expose the credentials themselves.

## Request contract

The backend calls `POST /generate` with an internal header and a callback URL:

```json
{
	"roadmap_id": "rm_example",
	"topic": "Python",
	"goal": "job_ready",
	"learner_profile": {
		"experience": "some_experience",
		"weekly_hours": 6,
		"target": "Build a portfolio API"
	},
	"callback_url": "http://localhost:4000/internal/roadmaps/rm_example"
}
```

The endpoint returns `202` after accepting the job. The actual work runs in a FastAPI background task.

The service later sends one of these requests to the callback URL:

- `POST /complete` with the roadmap JSON.
- `POST /fail` with a short error message.

Both callback requests include `X-Internal-Key`.

## Roadmap output

Each roadmap contains three to five stages with topic and project nodes. Topic nodes can include up to three resources. Project nodes can include:

- A deliverable
- Requirements
- Milestones
- Acceptance criteria
- Optional stretch goals

The service limits stages to five nodes per stage and stages to five total. The backend performs a second schema validation before storing the result.

## Deployment

Run this as a long-lived web service because the backend callback happens after the initial request:

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port "$PORT"
```

For a monorepo deployment, set the service root to `ai/`. Configure `INTERNAL_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `TINYFISH_API_KEY` in the deployment environment. Never place these values in the frontend.

The deployed backend must use the same `INTERNAL_KEY`, and its `AI_URL` must point to this service without a trailing slash.
