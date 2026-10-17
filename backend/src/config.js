import 'dotenv/config';

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env variable: ${name}`);
  return v;
};

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  internalKey: required('INTERNAL_KEY'),
  aiUrl: process.env.AI_URL || 'http://localhost:8000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  generationTimeoutMin: Number(process.env.GENERATION_TIMEOUT_MIN || 5),
};
