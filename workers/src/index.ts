import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { json } from 'hono/json';
import { uploadRouter } from './routes/upload';
import { questionnaireRouter } from './routes/questionnaire';
import { kbRouter } from './routes/kb';
import { healthRouter } from './routes/health';

// Types for Cloudflare bindings (generated via wrangler)
interface Env {
  DB: D1Database; // D1 binding
  R2: R2Bucket; // R2 bucket
  VECTORIZE: Vectorize; // Vectorize binding
  PROCESSING_QUEUE: Queue; // Queue for processing tasks
  INDEXING_QUEUE: Queue; // Queue for KB indexing
  EXPORT_QUEUE: Queue; // Queue for export generation
  OPENAI_API_KEY: string; // secret
  CLERK_SECRET_KEY: string; // secret
  // Additional env vars can be added here
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use('*', cors());
app.use('*', json());

// Health check
app.get('/', healthRouter);

// Upload routes (questionnaire files, KB documents)
app.route('/api/upload', uploadRouter);

// Questionnaire lifecycle routes (parse, answer, review, export)
app.route('/api/questionnaire', questionnaireRouter);

// Knowledge base management routes
app.route('/api/kb', kbRouter);

export default app;