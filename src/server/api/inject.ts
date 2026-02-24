import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { previewInjection, executeInjection } from '../injector/index.js';

// ---------------------------------------------------------------------------
// Fastify Plugin
// ---------------------------------------------------------------------------

export default async function injectRoutes(fastify: FastifyInstance): Promise<void> {

  // -------------------------------------------------------------------------
  // GET /api/repos/:repoId/inject/preview
  //
  // Returns the list of files that would be written, directories created,
  // and gitignore entries added — without touching disk.
  // -------------------------------------------------------------------------
  fastify.get(
    '/api/repos/:repoId/inject/preview',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId } = request.params as { repoId: string };

      try {
        const result = previewInjection(repoId);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';

        if (message.startsWith('Repo not found')) {
          return reply.status(404).send({ error: message });
        }
        if (message.startsWith('Repo directory does not exist')) {
          return reply.status(400).send({ error: message });
        }

        fastify.log.error(err, 'Injection preview failed');
        return reply.status(500).send({ error: message });
      }
    },
  );

  // -------------------------------------------------------------------------
  // POST /api/repos/:repoId/inject
  //
  // Executes the injection: writes files, creates directories, updates
  // .gitignore, and sets injected_at on the repo.
  // -------------------------------------------------------------------------
  fastify.post(
    '/api/repos/:repoId/inject',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId } = request.params as { repoId: string };

      try {
        const result = executeInjection(repoId);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';

        if (message.startsWith('Repo not found')) {
          return reply.status(404).send({ error: message });
        }
        if (message.startsWith('Repo directory does not exist')) {
          return reply.status(400).send({ error: message });
        }
        if (message.startsWith('No write permission')) {
          return reply.status(403).send({ error: message });
        }

        fastify.log.error(err, 'Injection failed');
        return reply.status(500).send({ error: message });
      }
    },
  );
}
