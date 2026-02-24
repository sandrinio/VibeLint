import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getRepo, getDb } from '../db/queries.js';
import { runAnalysis } from '../analyzer/engine.js';

// ---------------------------------------------------------------------------
// Fastify Plugin
// ---------------------------------------------------------------------------

export default async function analysisRoutes(fastify: FastifyInstance): Promise<void> {

  // -------------------------------------------------------------------------
  // POST /api/repos/:repoId/analysis
  //
  // Trigger a full analysis run on the repo. Returns the structured report.
  // -------------------------------------------------------------------------
  fastify.post(
    '/api/repos/:repoId/analysis',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId } = request.params as { repoId: string };

      const repo = getRepo(repoId);
      if (!repo) {
        return reply.status(404).send({ error: `Repo not found: ${repoId}` });
      }

      try {
        const report = runAnalysis(repoId);
        return report;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';

        if (message.includes('does not exist')) {
          return reply.status(400).send({ error: message });
        }

        fastify.log.error(err, 'Analysis failed');
        return reply.status(500).send({ error: message });
      }
    },
  );

  // -------------------------------------------------------------------------
  // GET /api/repos/:repoId/analysis/latest
  //
  // Get the most recent analysis result from SQLite.
  // -------------------------------------------------------------------------
  fastify.get(
    '/api/repos/:repoId/analysis/latest',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId } = request.params as { repoId: string };

      const repo = getRepo(repoId);
      if (!repo) {
        return reply.status(404).send({ error: `Repo not found: ${repoId}` });
      }

      const db = getDb();
      const row = db.prepare(
        'SELECT * FROM analyses WHERE repo_id = ? ORDER BY created_at DESC LIMIT 1',
      ).get(repoId) as {
        id: number;
        repo_id: string;
        branch: string | null;
        base_branch: string | null;
        diff_stats: string | null;
        analysis_data: string | null;
        created_at: string;
      } | undefined;

      if (!row) {
        return reply.status(404).send({ error: 'No analysis found for this repo' });
      }

      return {
        id: row.id,
        repoId: row.repo_id,
        branch: row.branch,
        baseBranch: row.base_branch,
        diffStats: row.diff_stats ? JSON.parse(row.diff_stats) : null,
        analysisData: row.analysis_data ? JSON.parse(row.analysis_data) : null,
        createdAt: row.created_at,
      };
    },
  );

  // -------------------------------------------------------------------------
  // GET /api/repos/:repoId/analysis/history
  //
  // Get analysis history for a repo (last 20 entries).
  // -------------------------------------------------------------------------
  fastify.get(
    '/api/repos/:repoId/analysis/history',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId } = request.params as { repoId: string };

      const repo = getRepo(repoId);
      if (!repo) {
        return reply.status(404).send({ error: `Repo not found: ${repoId}` });
      }

      const db = getDb();
      const rows = db.prepare(
        'SELECT id, created_at, analysis_data FROM analyses WHERE repo_id = ? ORDER BY created_at DESC LIMIT 20',
      ).all(repoId) as Array<{ id: number; created_at: string; analysis_data: string | null }>;

      return rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        analysisData: row.analysis_data ? JSON.parse(row.analysis_data) : null,
      }));
    },
  );
}
