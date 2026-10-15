# AI service (Python / FastAPI)

`main.py` is a **stub**: it waits a few seconds and returns a fake roadmap so the whole app can be tested.
Replace `build_roadmap(topic, goal)` with the real pipeline. Do not change the contract below.

## Run

```bash
cd ai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # INTERNAL_KEY must equal the backend's INTERNAL_KEY
uvicorn main:app --port 8000
```

## Contract with the backend

**1. Backend -> AI:** `POST /generate` with header `X-Internal-Key`

```json
{ "roadmap_id": "rm_ab12cd34ef", "topic": "Data Structures", "goal": "intermediate",
  "callback_url": "http://localhost:4000/internal/roadmaps/rm_ab12cd34ef" }
```

Reply `202` immediately and work in the background (generation takes 1-2 minutes).
`goal` is `beginner`, `intermediate` or `job_ready`.

**2. AI -> backend when done:** `POST {callback_url}/complete` with `X-Internal-Key`

```json
{
  "summary": "One sentence about the path.",
  "stages": [
    {
      "title": "Foundations",
      "description": "Short description.",
      "nodes": [
        {
          "type": "topic",
          "title": "Time and Space Complexity",
          "description": "Short description.",
          "limited_resources": false,
          "resources": [
            { "title": "Big O Explained", "url": "https://...", "source": "YouTube",
              "type": "video", "duration_minutes": 28 }
          ]
        },
        { "type": "project", "title": "Mini project: ...", "description": "...",
          "limited_resources": false, "resources": [] }
      ]
    }
  ]
}
```

Rules (the backend enforces them and replies 400 with a message if broken):

- **No ids, no hour totals.** The backend assigns ids and order from the array order.
- Node `type`: `topic` or `project`. Projects have no resources.
- Resource `type`: `video`, `article`, `course`, `docs`, `book`, `repo`, `interactive`.
- `url` must be a valid URL. Max 3 resources per node (extras are dropped). `duration_minutes` may be `null`.
- Set `limited_resources: true` when you could not find good material.
- Only use URLs that came from your retrieval step. Never let the LLM write URLs.

**3. AI -> backend on failure:** `POST {callback_url}/fail` with `{ "error": "short message" }`.
Always call `/complete` or `/fail`. If neither arrives, the backend marks the job failed after 5 minutes.
