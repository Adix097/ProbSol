-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roadmaps are shared: one row per (normalized topic, goal).
-- `content` holds { summary, stages: [...] } with all ids already assigned.
CREATE TABLE IF NOT EXISTS roadmaps (
  id               TEXT PRIMARY KEY,
  normalized_topic TEXT NOT NULL,
  topic            TEXT NOT NULL,
  goal             TEXT NOT NULL CHECK (goal IN ('beginner','intermediate','job_ready')),
  status           TEXT NOT NULL CHECK (status IN ('queued','generating','ready','failed')),
  error            TEXT NOT NULL DEFAULT '',
  content          JSONB,
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_at     TIMESTAMPTZ,
  UNIQUE (normalized_topic, goal)
);

-- Which user has which roadmap in "My roadmaps".
CREATE TABLE IF NOT EXISTS user_roadmaps (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id  TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, roadmap_id)
);

-- A row is only stored for in_progress / completed. No row = not_started.
CREATE TABLE IF NOT EXISTS progress (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id  TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  node_id     TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('in_progress','completed')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, roadmap_id, node_id)
);

-- Every time a user triggers a generation (used for the daily limit).
CREATE TABLE IF NOT EXISTS generation_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id  TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS generation_log_user_time ON generation_log (user_id, created_at);
