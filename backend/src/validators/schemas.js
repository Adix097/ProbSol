import { z } from 'zod';

export const GOALS = ['beginner', 'intermediate', 'job_ready'];
export const RESOURCE_TYPES = ['video', 'article', 'course', 'docs', 'book', 'repo', 'interactive'];
export const NODE_TYPES = ['topic', 'project'];
export const PROGRESS_STATUSES = ['not_started', 'in_progress', 'completed'];

// ---- public API input ----
export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(60),
  email: z.string().trim().toLowerCase().email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email.'),
  password: z.string().min(1, 'Please enter your password.'),
});

export const createRoadmapSchema = z.object({
  topic: z.string().trim().min(2, 'Topic must be at least 2 characters.').max(100, 'Topic must be at most 100 characters.').transform((t) => t.replace(/\s+/g, ' ')),
  goal: z.enum(GOALS, { error: 'Goal must be beginner, intermediate or job_ready.' }),
  learner_profile: z.object({
    experience: z.enum(['beginner', 'some_experience', 'advanced']).default('beginner'),
    weekly_hours: z.number().int().min(1).max(40).default(5),
    target: z.string().trim().max(160).default(''),
  }).default({}),
});

export const progressUpdateSchema = z.object({
  status: z.enum(PROGRESS_STATUSES, { error: 'Status must be not_started, in_progress or completed.' }),
});

// ---- what the AI service sends back (no ids, no totals) ----
const resourceSchema = z.object({
  title: z.string().trim().min(1),
  url: z.string().trim().url(),
  source: z.string().trim().default(''),
  type: z.enum(RESOURCE_TYPES),
  duration_minutes: z.number().int().positive().nullable().default(null),
});

const nodeSchema = z.object({
  type: z.enum(NODE_TYPES),
  title: z.string().trim().min(1),
  description: z.string().trim().default(''),
  limited_resources: z.boolean().default(false),
  resources: z.array(resourceSchema).default([]),
  project: z.object({
    deliverable: z.string().trim().default(''),
    requirements: z.array(z.string().trim()).default([]),
    milestones: z.array(z.string().trim()).default([]),
    acceptance_criteria: z.array(z.string().trim()).default([]),
    stretch_goals: z.array(z.string().trim()).default([]),
  }).nullable().optional(),
});

const stageSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().default(''),
  nodes: z.array(nodeSchema).min(1),
});

export const aiCompleteSchema = z.object({
  summary: z.string().trim().default(''),
  stages: z.array(stageSchema).min(1),
});

export const aiFailSchema = z.object({
  error: z.string().trim().max(300).optional(),
});
