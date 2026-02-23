import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { nanoid } from 'nanoid';
import path from 'node:path';
import fs from 'node:fs';
import { scanRepo, type RepoScanResult } from '../git/scanner.js';
import {
  createRepo,
  getRepo,
  listRepos,
  deleteRepo,
  updateRepo,
} from '../db/queries.js';
import type { RepoRow } from '../db/schema.js';

interface RepoResponse {
  id: string;
  path: string;
  name: string;
  languages: string[];
  platform: string | null;
  injected_at: string | null;
  created_at: string;
  last_scan_at: string | null;
  scan?: RepoScanResult;
}

function formatRepoResponse(row: RepoRow, scan?: RepoScanResult): RepoResponse {
  return {
    id: row.id,
    path: row.path,
    name: row.name,
    languages: JSON.parse(row.languages),
    platform: row.platform,
    injected_at: row.injected_at,
    created_at: row.created_at,
    last_scan_at: row.last_scan_at,
    scan,
  };
}

export default async function reposRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/repos
  fastify.get('/api/repos', async () => {
    const rows = listRepos();
    return rows.map((row) => formatRepoResponse(row));
  });

  // POST /api/repos
  fastify.post('/api/repos', async (request: FastifyRequest, reply: FastifyReply) => {
    const { path: rawPath } = request.body as { path: string };

    if (!rawPath || typeof rawPath !== 'string') {
      return reply.status(400).send({ error: 'Missing or invalid "path" in request body.' });
    }

    // Path traversal protection
    const repoPath = path.resolve(rawPath);

    try {
      const stat = fs.statSync(repoPath);
      if (!stat.isDirectory()) {
        return reply.status(400).send({ error: 'Invalid repository path: not a directory.' });
      }
    } catch {
      return reply.status(400).send({ error: 'Invalid repository path: directory does not exist.' });
    }

    const gitPath = path.join(repoPath, '.git');
    if (!fs.existsSync(gitPath)) {
      return reply.status(400).send({ error: 'Invalid repository path: not a git repository (no .git found).' });
    }

    // Duplicate check
    const existing = listRepos().find((r) => r.path === repoPath);
    if (existing) {
      return reply.status(409).send({
        error: `Repository at "${repoPath}" is already connected.`,
        existingId: existing.id,
      });
    }

    // Scan repo
    let scan: RepoScanResult;
    try {
      scan = scanRepo(repoPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to scan repository.';
      return reply.status(400).send({ error: message });
    }

    // Insert into DB
    const id = nanoid(12);
    const row = createRepo({
      id,
      path: scan.path,
      name: scan.name,
      languages: scan.languages,
    });

    return reply.status(201).send(formatRepoResponse(row, scan));
  });

  // DELETE /api/repos/:id
  fastify.delete('/api/repos/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const existing = getRepo(id);
    if (!existing) {
      return reply.status(404).send({ error: `Repo not found: ${id}` });
    }
    deleteRepo(id);
    return { success: true, id };
  });

  // POST /api/repos/:id/scan — re-scan
  fastify.post('/api/repos/:id/scan', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const existing = getRepo(id);
    if (!existing) {
      return reply.status(404).send({ error: `Repo not found: ${id}` });
    }

    let scan: RepoScanResult;
    try {
      scan = scanRepo(existing.path);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to re-scan repository.';
      return reply.status(500).send({ error: message });
    }

    const updated = updateRepo(id, {
      languages: JSON.stringify(scan.languages),
      last_scan_at: new Date().toISOString(),
    });

    if (!updated) {
      return reply.status(500).send({ error: 'Failed to update repo after scan.' });
    }

    return formatRepoResponse(updated, scan);
  });
}
