import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import roadmapRoutes from './routes/roadmaps.js';
import progressRoutes from './routes/progress.js';
import meRoutes from './routes/me.js';
import internalRoutes from './routes/internal.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', 1); // correct client IPs behind Render/Railway etc.
app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/roadmaps', progressRoutes);
app.use('/api/me', meRoutes);
app.use('/internal', internalRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
