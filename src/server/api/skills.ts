import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig, setConfig, deleteConfig, getRepo, getDb } from '../db/queries.js';
import { loadTemplate, listTemplates, TemplateNotFoundError, stripExtension } from '../templates/loader.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkillResponse {
  name: string;
  category: string;
  content: string;
  isDefault: boolean;
  isModified: boolean;
}

interface RepoParams {
  repoId: string;
}

interface SkillParams extends RepoParams {
  name: string;
}

interface CreateSkillBody {
  name: string;
  content: string;
}

interface UpdateSkillBody {
  content: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Validate that a skill name contains only alphanumeric, hyphens, and underscores. */
function isValidSkillName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

/** Build the config key for a repo skill. */
function skillKey(repoId: string, name: string): string {
  return `skills:${repoId}:${name}`;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export default async function skillsRoutes(fastify: FastifyInstance): Promise<void> {

  // -------------------------------------------------------------------------
  // 1. GET /api/repos/:repoId/skills — list all skills for a repo
  // -------------------------------------------------------------------------
  fastify.get('/api/repos/:repoId/skills', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoId } = request.params as RepoParams;

    const repo = getRepo(repoId);
    if (!repo) {
      return reply.status(404).send({ error: `Repo not found: ${repoId}` });
    }

    // Built-in default skills from templates
    const defaults = listTemplates('skills');
    const defaultNames = new Set(defaults.map((t) => stripExtension(t.name)));

    // Custom overrides / fully-custom skills from config table
    const db = getDb();
    const escapedRepoId = repoId.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const prefix = `skills:${repoId}:`;
    const rows = db.prepare("SELECT key, value FROM config WHERE key LIKE ? ESCAPE '\\'").all(`skills:${escapedRepoId}:%`) as { key: string; value: string }[];

    const customMap = new Map<string, string>();
    for (const row of rows) {
      const name = row.key.slice(prefix.length);
      customMap.set(name, row.value);
    }

    // Merge: start with defaults
    const skills: SkillResponse[] = defaults.map((t) => {
      const name = stripExtension(t.name);
      const customContent = customMap.get(name);
      return {
        name,
        category: 'skills',
        content: customContent ?? t.content,
        isDefault: true,
        isModified: customContent !== undefined,
      };
    });

    // Append fully-custom skills (names not in defaults)
    for (const [name, content] of customMap) {
      if (!defaultNames.has(name)) {
        skills.push({
          name,
          category: 'skills',
          content,
          isDefault: false,
          isModified: false,
        });
      }
    }

    return skills;
  });

  // -------------------------------------------------------------------------
  // 2. GET /api/repos/:repoId/skills/:name — get a single skill
  // -------------------------------------------------------------------------
  fastify.get('/api/repos/:repoId/skills/:name', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoId, name } = request.params as SkillParams;

    const repo = getRepo(repoId);
    if (!repo) {
      return reply.status(404).send({ error: `Repo not found: ${repoId}` });
    }

    if (!isValidSkillName(name)) {
      return reply.status(400).send({ error: 'Invalid skill name. Use only alphanumeric characters, hyphens, and underscores.' });
    }

    // Check for custom override first
    const customContent = getConfig(skillKey(repoId, name));
    if (customContent !== undefined) {
      // Determine if there is also a built-in default with this name
      let hasDefault = false;
      try {
        loadTemplate('skills', `${name}.md`);
        hasDefault = true;
      } catch {
        // No default template exists
      }

      return {
        name,
        category: 'skills',
        content: customContent,
        isDefault: hasDefault,
        isModified: true,
      } satisfies SkillResponse;
    }

    // Fall back to built-in default
    try {
      const template = loadTemplate('skills', `${name}.md`);
      return {
        name: stripExtension(template.name),
        category: 'skills',
        content: template.content,
        isDefault: true,
        isModified: false,
      } satisfies SkillResponse;
    } catch (err) {
      if (err instanceof TemplateNotFoundError) {
        return reply.status(404).send({ error: `Skill not found: ${name}` });
      }
      throw err;
    }
  });

  // -------------------------------------------------------------------------
  // 3. PUT /api/repos/:repoId/skills/:name — save/update a custom skill
  // -------------------------------------------------------------------------
  fastify.put('/api/repos/:repoId/skills/:name', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoId, name } = request.params as SkillParams;
    const { content } = request.body as UpdateSkillBody;

    const repo = getRepo(repoId);
    if (!repo) {
      return reply.status(404).send({ error: `Repo not found: ${repoId}` });
    }

    if (!isValidSkillName(name)) {
      return reply.status(400).send({ error: 'Invalid skill name. Use only alphanumeric characters, hyphens, and underscores.' });
    }

    if (content === undefined || content === null || typeof content !== 'string') {
      return reply.status(400).send({ error: 'Missing or invalid "content" in request body.' });
    }

    setConfig(skillKey(repoId, name), content);

    // Determine if a built-in default exists
    let hasDefault = false;
    try {
      loadTemplate('skills', `${name}.md`);
      hasDefault = true;
    } catch {
      // No default template
    }

    return {
      name,
      category: 'skills',
      content,
      isDefault: hasDefault,
      isModified: true,
    } satisfies SkillResponse;
  });

  // -------------------------------------------------------------------------
  // 4. POST /api/repos/:repoId/skills — create a new custom skill
  // -------------------------------------------------------------------------
  fastify.post('/api/repos/:repoId/skills', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoId } = request.params as RepoParams;
    const { name, content } = request.body as CreateSkillBody;

    const repo = getRepo(repoId);
    if (!repo) {
      return reply.status(404).send({ error: `Repo not found: ${repoId}` });
    }

    if (!name || typeof name !== 'string') {
      return reply.status(400).send({ error: 'Missing or invalid "name" in request body.' });
    }

    if (!isValidSkillName(name)) {
      return reply.status(400).send({ error: 'Invalid skill name. Use only alphanumeric characters, hyphens, and underscores.' });
    }

    if (content === undefined || content === null || typeof content !== 'string') {
      return reply.status(400).send({ error: 'Missing or invalid "content" in request body.' });
    }

    // Check for duplicate
    const existing = getConfig(skillKey(repoId, name));
    if (existing !== undefined) {
      return reply.status(409).send({ error: `Skill already exists: ${name}. Use PUT to update.` });
    }

    setConfig(skillKey(repoId, name), content);

    return reply.status(201).send({
      name,
      category: 'skills',
      content,
      isDefault: false,
      isModified: false,
    } satisfies SkillResponse);
  });

  // -------------------------------------------------------------------------
  // 5. DELETE /api/repos/:repoId/skills/:name — delete a custom skill
  // -------------------------------------------------------------------------
  fastify.delete('/api/repos/:repoId/skills/:name', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoId, name } = request.params as SkillParams;

    const repo = getRepo(repoId);
    if (!repo) {
      return reply.status(404).send({ error: `Repo not found: ${repoId}` });
    }

    if (!isValidSkillName(name)) {
      return reply.status(400).send({ error: 'Invalid skill name. Use only alphanumeric characters, hyphens, and underscores.' });
    }

    // Check if this is a built-in default
    const defaults = listTemplates('skills');
    const isBuiltIn = defaults.some((t) => stripExtension(t.name) === name);
    if (isBuiltIn) {
      return reply.status(400).send({ error: 'Cannot delete built-in skill. Use reset instead.' });
    }

    const deleted = deleteConfig(skillKey(repoId, name));
    if (!deleted) {
      return reply.status(404).send({ error: `Custom skill not found: ${name}` });
    }

    return reply.status(204).send();
  });

  // -------------------------------------------------------------------------
  // 6. POST /api/repos/:repoId/skills/:name/reset — reset to default template
  // -------------------------------------------------------------------------
  fastify.post('/api/repos/:repoId/skills/:name/reset', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoId, name } = request.params as SkillParams;

    const repo = getRepo(repoId);
    if (!repo) {
      return reply.status(404).send({ error: `Repo not found: ${repoId}` });
    }

    if (!isValidSkillName(name)) {
      return reply.status(400).send({ error: 'Invalid skill name. Use only alphanumeric characters, hyphens, and underscores.' });
    }

    // Delete any custom override
    deleteConfig(skillKey(repoId, name));

    // Return the default template
    try {
      const template = loadTemplate('skills', `${name}.md`);
      return {
        name: stripExtension(template.name),
        category: 'skills',
        content: template.content,
        isDefault: true,
        isModified: false,
      } satisfies SkillResponse;
    } catch (err) {
      if (err instanceof TemplateNotFoundError) {
        return reply.status(404).send({ error: `Default skill template not found: ${name}` });
      }
      throw err;
    }
  });
}
