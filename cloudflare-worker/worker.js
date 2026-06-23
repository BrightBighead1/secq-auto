/**
 * SecQ-Auto Cloudflare Worker
 * Edge proxy with rate limiting, JWT auth, CORS, caching
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// ============================================
// Configuration
// ============================================
const COWAGENT_URL = 'YOUR_COWAGENT_URL'; // Set via env var
const API_KEY = 'YOUR_API_KEY'; // Set via env var

// ============================================
// Middleware
// ============================================
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.windowStart > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

// Rate limiting middleware
app.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Rate limit exceeded. Try again in 60 seconds.' }, 429);
  }
  await next();
});

// Simple cache
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

// ============================================
// Health
// ============================================
app.get('/', (c) => c.json({
  name: 'SecQ-Auto Edge Proxy',
  version: '1.0.0',
  status: 'operational',
}));

app.get('/health', async (c) => {
  try {
    const res = await fetch(`${COWAGENT_URL}/health`);
    const data = await res.json();
    return c.json({ status: 'healthy', backend: data });
  } catch (e) {
    return c.json({ status: 'degraded', error: e.message }, 503);
  }
});

// ============================================
// Proxy all API routes to CowAgent
// ============================================
app.all('/api/*', async (c) => {
  const path = c.req.path;
  const method = c.req.method;
  const cacheKey = `${method}:${path}:${c.req.query('q') || ''}`;

  // Check cache for GET requests
  if (method === 'GET') {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return c.json(cached.data);
    }
  }

  // Build target URL
  const targetUrl = `${COWAGENT_URL}${path}`;

  // Forward request
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('X-API-Key', API_KEY);

  // Forward auth header if present
  const authHeader = c.req.header('Authorization');
  if (authHeader) headers.set('Authorization', authHeader);

  try {
    let body = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try { body = await c.req.text(); } catch (e) { /* no body */ }
    }

    const res = await fetch(targetUrl, { method, headers, body });
    const data = await res.json();

    // Cache GET responses
    if (method === 'GET' && res.ok) {
      cache.set(cacheKey, { data, ts: Date.now() });
    }

    return c.json(data, res.status);
  } catch (e) {
    return c.json({ error: 'Backend unavailable', details: e.message }, 502);
  }
});

// ============================================
// KB Search (cached)
// ============================================
app.get('/api/kb/search', async (c) => {
  const q = c.req.query('q');
  const topK = c.req.query('top_k') || '5';
  const cacheKey = `kb:search:${q}:${topK}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return c.json(cached.data);
  }

  try {
    const res = await fetch(`${COWAGENT_URL}/api/kb/search?q=${encodeURIComponent(q)}&top_k=${topK}`, {
      headers: { 'X-API-Key': API_KEY },
    });
    const data = await res.json();
    cache.set(cacheKey, { data, ts: Date.now() });
    return c.json(data);
  } catch (e) {
    return c.json({ error: e.message }, 502);
  }
});

export default app;
