import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig, setConfig, getAllConfig } from '../db/queries.js';
import { detectPlatforms } from '../utils/platform-detect.js';

export default async function configRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/config
  fastify.get('/api/config', async () => {
    return getAllConfig();
  });

  // GET /api/config/:key
  fastify.get('/api/config/:key', async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as { key: string };
    const raw = getConfig(key);
    if (raw === undefined) {
      return reply.status(404).send({ error: `Config key not found: ${key}` });
    }
    // Try parsing JSON for stored objects/arrays
    let value: unknown = raw;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        value = parsed;
      }
    } catch {
      // plain string — use as-is
    }
    return { key, value };
  });

  // PUT /api/config/:key
  fastify.put('/api/config/:key', async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as { key: string };
    const { value } = request.body as { value: unknown };
    if (value === undefined || value === null) {
      return reply.status(400).send({ error: 'Missing "value" in request body.' });
    }
    // Store objects/arrays as JSON, primitives as strings
    const stored = typeof value === 'string' ? value : JSON.stringify(value);
    setConfig(key, stored);
    return { key, value: stored };
  });

  // GET /api/setup/status
  fastify.get('/api/setup/status', async () => {
    const wizardComplete = getConfig('wizard_complete');
    const selectedPlatform = getConfig('selected_platform');
    return {
      completed: wizardComplete === 'true',
      platform: selectedPlatform ?? null,
    };
  });

  // POST /api/setup/complete
  fastify.post('/api/setup/complete', async (request: FastifyRequest, reply: FastifyReply) => {
    const { platform } = request.body as { platform: string };
    if (!platform || typeof platform !== 'string') {
      return reply.status(400).send({ error: 'Missing "platform" in request body.' });
    }
    setConfig('wizard_complete', 'true');
    setConfig('selected_platform', platform);
    return { completed: true, platform };
  });

  // GET /api/setup/platforms
  fastify.get('/api/setup/platforms', async () => {
    return detectPlatforms();
  });
}
