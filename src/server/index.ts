import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDb } from './db/queries.js';
import configRoutes from './api/config.js';
import reposRoutes from './api/repos.js';
import skillsRoutes from './api/skills.js';
import rulesRoutes from './api/rules.js';
import commandsRoutes from './api/commands.js';
import fsRoutes from './api/fs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_VERSION = '0.1.0';

export interface ServerOptions {
  port?: number;
  host?: string;
}

export async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: 'info',
    },
  });

  // --- CORS (manual, avoids extra dependency) ---
  server.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      reply.status(204).send();
    }
  });

  // --- Static files (production) ---
  const clientDistPath = path.resolve(__dirname, '../../dist/client');
  if (fs.existsSync(clientDistPath)) {
    await server.register(fastifyStatic, {
      root: clientDistPath,
      prefix: '/',
      wildcard: false,
    });
  }

  // --- Initialize Database ---
  initDb();

  // --- API Routes ---
  await server.register(configRoutes);
  await server.register(reposRoutes);
  await server.register(skillsRoutes);
  await server.register(rulesRoutes);
  await server.register(commandsRoutes);
  await server.register(fsRoutes);

  // --- Health Check ---
  server.get('/api/health', async () => {
    return { status: 'ok', version: PKG_VERSION };
  });

  return server;
}

export async function startServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const port = options.port ?? 3847;
  const host = options.host ?? '127.0.0.1';

  const server = await createServer();

  // --- Graceful Shutdown ---
  const shutdown = async () => {
    server.log.info('Shutting down gracefully...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // --- Start ---
  try {
    await server.listen({ port, host });
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Is VibeLint already running?`);
      process.exit(1);
    }
    throw err;
  }

  return server;
}
