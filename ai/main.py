# It fakes the pipeline so the backend and frontend can be tested end to end
# replace `build_roadmap()` with the real pipeline (LLM + retrieval + ranking)
# Everything else in this file should stay as it is

import asyncio
import os
import secrets

import httpx
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException
from pydantic import BaseModel

load_dotenv()
INTERNAL_KEY = os.environ["INTERNAL_KEY"]
STUB_DELAY = float(os.getenv("STUB_DELAY_SECONDS", "8"))

app = FastAPI(title="ProbSol AI service (stub)")


class GenerateRequest(BaseModel):
    roadmap_id: str
    topic: str
    goal: str  # "beginner" | "intermediate" | "job_ready"
    callback_url: str  # e.g. http://localhost:4000/internal/roadmaps/rm_ab12cd34ef


def build_roadmap(topic: str, goal: str) -> dict:
    """REPLACE THIS with the real pipeline. Must return the shape in README.md (no ids, no totals)."""
    return {
        "summary": f"A learning path for {topic} (level: {goal.replace('_', ' ')}), from core ideas to hands-on projects.",
        "stages": [
            {
                "title": "Foundations",
                "description": f"The basic ideas you need before going deeper into {topic}.",
                "nodes": [
                    {
                        "type": "topic",
                        "title": f"What is {topic}?",
                        "description": "Get the big picture and the vocabulary.",
                        "limited_resources": False,
                        "resources": [
                            {"title": f"{topic} explained for beginners", "url": "https://example.com/intro-video",
                             "source": "YouTube", "type": "video", "duration_minutes": 25},
                            {"title": f"Getting started with {topic}", "url": "https://example.com/intro-article",
                             "source": "freeCodeCamp", "type": "article", "duration_minutes": 15},
                        ],
                    },
                    {
                        "type": "topic",
                        "title": "Core concepts",
                        "description": "The ideas everything else is built on.",
                        "limited_resources": False,
                        "resources": [
                            {"title": f"{topic}: core concepts", "url": "https://example.com/core-docs",
                             "source": "Official docs", "type": "docs", "duration_minutes": None},
                        ],
                    },
                ],
            },
            {
                "title": "Practice",
                "description": "Apply what you learned.",
                "nodes": [
                    {
                        "type": "topic",
                        "title": "Guided exercises",
                        "description": "Work through structured problems.",
                        "limited_resources": True,
                        "resources": [],
                    },
                    {
                        "type": "project",
                        "title": f"Mini project: build something with {topic}",
                        "description": "Combine the basics in one small project.",
                        "limited_resources": False,
                        "resources": [],
                    },
                ],
            },
        ],
    }


async def run_job(req: GenerateRequest) -> None:
    headers = {"X-Internal-Key": INTERNAL_KEY}
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            await asyncio.sleep(STUB_DELAY)  # pretend to work
            if "fail" in req.topic.lower():  # type "fail" as the topic to test the error state
                raise RuntimeError("Stub failure requested")
            result = build_roadmap(req.topic, req.goal)
            r = await client.post(f"{req.callback_url}/complete", json=result, headers=headers)
            r.raise_for_status()
        except Exception as exc:  # any failure -> tell the backend so the user is not stuck
            print(f"Job {req.roadmap_id} failed: {exc}")
            try:
                await client.post(
                    f"{req.callback_url}/fail",
                    json={"error": "We could not generate this roadmap. Please try again."},
                    headers=headers,
                )
            except Exception as exc2:
                print(f"Could not report failure to backend: {exc2}")


@app.post("/generate", status_code=202)
async def generate(req: GenerateRequest, background: BackgroundTasks, x_internal_key: str = Header(default="")):
    if not secrets.compare_digest(x_internal_key, INTERNAL_KEY):
        raise HTTPException(status_code=401, detail="Invalid internal key")
    background.add_task(run_job, req)  # respond 202 now, work in the background
    return {"accepted": True}


@app.get("/health")
async def health():
    return {"ok": True}
