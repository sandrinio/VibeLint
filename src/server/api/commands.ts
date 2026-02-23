import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getRepo, getConfig, setConfig, deleteConfig, getDb } from '../db/queries.js';
import { listTemplates, loadTemplate, TemplateNotFoundError, stripExtension } from '../templates/loader.js';
import type { ConfigRow } from '../db/schema.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandResponse {
  name: string;
  content: string;
  description: string;
  isDefault: boolean;
  isModified: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a description from the first `# Heading` line in the markdown
 * content. Falls back to `'Custom command'` if no heading is found.
 */
function extractDescription(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Custom command';
}

/**
 * Determine the template category for commands based on the repo's platform.
 */
function commandCategory(platform: string | null): string {
  return platform === 'claude-code' ? 'commands/claude-code' : 'commands/generic';
}

/**
 * Build the config key used to store a custom/overridden command.
 */
function configKey(repoId: string, name: string): string {
  return `commands:${repoId}:${name}`;
}

function isValidCommandName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

/**
 * Retrieve all custom command config rows for a given repo by querying
 * config keys that start with `commands:{repoId}:`.
 */
function getCustomConfigRows(repoId: string): ConfigRow[] {
  const db = getDb();
  const escapedRepoId = repoId.replace(/%/g, '\\%').replace(/_/g, '\\_');
  return db
    .prepare("SELECT key, value FROM config WHERE key LIKE ? ESCAPE '\\'")
    .all(`commands:${escapedRepoId}:%`) as ConfigRow[];
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export default async function commandsRoutes(fastify: FastifyInstance): Promise<void> {
  // -----------------------------------------------------------------------
  // GET /api/repos/:repoId/commands — list all commands for a repo
  // -----------------------------------------------------------------------
  fastify.get(
    '/api/repos/:repoId/commands',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId } = request.params as { repoId: string };

      const repo = getRepo(repoId);
      if (!repo) {
        return reply.status(404).send({ error: `Repo not found: ${repoId}` });
      }

      const category = commandCategory(repo.platform);
      const defaults = listTemplates(category);

      // Build a set of default command names (without extension)
      const defaultNames = new Set(defaults.map((t) => stripExtension(t.name)));

      // Fetch all custom overrides / custom commands from the config table
      const customRows = getCustomConfigRows(repoId);
      const customMap = new Map<string, string>();
      for (const row of customRows) {
        // key format: commands:{repoId}:{name}
        const name = row.key.slice(`commands:${repoId}:`.length);
        customMap.set(name, row.value);
      }

      const commands: CommandResponse[] = [];

      // 1. Process default templates (possibly overridden)
      for (const tmpl of defaults) {
        const name = stripExtension(tmpl.name);
        const customContent = customMap.get(name);

        if (customContent !== undefined) {
          // Overridden default
          commands.push({
            name,
            content: customContent,
            description: extractDescription(customContent),
            isDefault: true,
            isModified: true,
          });
        } else {
          // Unmodified default
          commands.push({
            name,
            content: tmpl.content,
            description: extractDescription(tmpl.content),
            isDefault: true,
            isModified: false,
          });
        }
      }

      // 2. Process fully custom commands (not matching any default template)
      for (const [name, content] of customMap) {
        if (!defaultNames.has(name)) {
          commands.push({
            name,
            content,
            description: extractDescription(content),
            isDefault: false,
            isModified: false,
          });
        }
      }

      return commands;
    },
  );

  // -----------------------------------------------------------------------
  // GET /api/repos/:repoId/commands/:name — get a single command
  // -----------------------------------------------------------------------
  fastify.get(
    '/api/repos/:repoId/commands/:name',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId, name } = request.params as { repoId: string; name: string };

      const repo = getRepo(repoId);
      if (!repo) {
        return reply.status(404).send({ error: `Repo not found: ${repoId}` });
      }

      if (!isValidCommandName(name)) {
        return reply.status(400).send({ error: 'Invalid command name. Use only alphanumeric characters, hyphens, and underscores.' });
      }

      // Check for custom / overridden version first
      const customContent = getConfig(configKey(repoId, name));
      if (customContent !== undefined) {
        // Determine if this is an override of a default or a fully custom command
        const category = commandCategory(repo.platform);
        let isDefault = false;
        try {
          loadTemplate(category, `${name}.md`);
          isDefault = true;
        } catch {
          // Not a default template — fully custom command
        }

        return {
          name,
          content: customContent,
          description: extractDescription(customContent),
          isDefault,
          isModified: true,
        } satisfies CommandResponse;
      }

      // Try loading from default templates
      const category = commandCategory(repo.platform);
      try {
        const tmpl = loadTemplate(category, `${name}.md`);
        return {
          name,
          content: tmpl.content,
          description: extractDescription(tmpl.content),
          isDefault: true,
          isModified: false,
        } satisfies CommandResponse;
      } catch (err) {
        if (err instanceof TemplateNotFoundError) {
          return reply.status(404).send({ error: `Command not found: ${name}` });
        }
        throw err;
      }
    },
  );

  // -----------------------------------------------------------------------
  // PUT /api/repos/:repoId/commands/:name — save / update command content
  // -----------------------------------------------------------------------
  fastify.put(
    '/api/repos/:repoId/commands/:name',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId, name } = request.params as { repoId: string; name: string };
      const { content } = request.body as { content: string };

      const repo = getRepo(repoId);
      if (!repo) {
        return reply.status(404).send({ error: `Repo not found: ${repoId}` });
      }

      if (!isValidCommandName(name)) {
        return reply.status(400).send({ error: 'Invalid command name. Use only alphanumeric characters, hyphens, and underscores.' });
      }

      if (content === undefined || content === null || typeof content !== 'string') {
        return reply.status(400).send({ error: 'Missing "content" in request body.' });
      }

      setConfig(configKey(repoId, name), content);

      // Determine if this is an override of a default template
      const category = commandCategory(repo.platform);
      let isDefault = false;
      try {
        loadTemplate(category, `${name}.md`);
        isDefault = true;
      } catch {
        // Not a default — custom command
      }

      return {
        name,
        content,
        description: extractDescription(content),
        isDefault,
        isModified: true,
      } satisfies CommandResponse;
    },
  );

  // -----------------------------------------------------------------------
  // POST /api/repos/:repoId/commands — create new custom command
  // -----------------------------------------------------------------------
  fastify.post(
    '/api/repos/:repoId/commands',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId } = request.params as { repoId: string };
      const { name, content } = request.body as { name: string; content: string };

      const repo = getRepo(repoId);
      if (!repo) {
        return reply.status(404).send({ error: `Repo not found: ${repoId}` });
      }

      // Validate name
      if (!name || typeof name !== 'string') {
        return reply.status(400).send({ error: 'Missing "name" in request body.' });
      }
      if (!isValidCommandName(name)) {
        return reply
          .status(400)
          .send({ error: 'Invalid command name. Use only alphanumeric characters, hyphens, and underscores.' });
      }

      if (content === undefined || content === null || typeof content !== 'string') {
        return reply.status(400).send({ error: 'Missing "content" in request body.' });
      }

      // Check for duplicates — either a custom command or a default template
      const existingCustom = getConfig(configKey(repoId, name));
      if (existingCustom !== undefined) {
        return reply.status(409).send({ error: `Command already exists: ${name}` });
      }

      const category = commandCategory(repo.platform);
      try {
        loadTemplate(category, `${name}.md`);
        // If we get here, a default template with this name exists
        return reply.status(409).send({ error: `Command already exists: ${name}` });
      } catch {
        // No default — good, we can create it
      }

      setConfig(configKey(repoId, name), content);

      const command: CommandResponse = {
        name,
        content,
        description: extractDescription(content),
        isDefault: false,
        isModified: false,
      };

      return reply.status(201).send(command);
    },
  );

  // -----------------------------------------------------------------------
  // DELETE /api/repos/:repoId/commands/:name — delete a custom command
  // -----------------------------------------------------------------------
  fastify.delete(
    '/api/repos/:repoId/commands/:name',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId, name } = request.params as { repoId: string; name: string };

      const repo = getRepo(repoId);
      if (!repo) {
        return reply.status(404).send({ error: `Repo not found: ${repoId}` });
      }

      if (!isValidCommandName(name)) {
        return reply.status(400).send({ error: 'Invalid command name. Use only alphanumeric characters, hyphens, and underscores.' });
      }

      // Block deletion of built-in default commands
      const category = commandCategory(repo.platform);
      let isBuiltIn = false;
      try {
        loadTemplate(category, `${name}.md`);
        isBuiltIn = true;
      } catch {
        // Not a built-in — can be deleted
      }

      if (isBuiltIn) {
        // Only block if there is no custom override (i.e. user is trying to
        // delete the actual built-in, not remove an override)
        const hasCustom = getConfig(configKey(repoId, name)) !== undefined;
        if (!hasCustom) {
          return reply.status(400).send({ error: 'Cannot delete built-in command' });
        }
      }

      deleteConfig(configKey(repoId, name));
      return reply.status(204).send();
    },
  );

  // -----------------------------------------------------------------------
  // POST /api/repos/:repoId/commands/:name/reset — reset to default template
  // -----------------------------------------------------------------------
  fastify.post(
    '/api/repos/:repoId/commands/:name/reset',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { repoId, name } = request.params as { repoId: string; name: string };

      const repo = getRepo(repoId);
      if (!repo) {
        return reply.status(404).send({ error: `Repo not found: ${repoId}` });
      }

      if (!isValidCommandName(name)) {
        return reply.status(400).send({ error: 'Invalid command name. Use only alphanumeric characters, hyphens, and underscores.' });
      }

      // Remove any custom override
      deleteConfig(configKey(repoId, name));

      // Load and return the default template
      const category = commandCategory(repo.platform);
      try {
        const tmpl = loadTemplate(category, `${name}.md`);
        return {
          name,
          content: tmpl.content,
          description: extractDescription(tmpl.content),
          isDefault: true,
          isModified: false,
        } satisfies CommandResponse;
      } catch (err) {
        if (err instanceof TemplateNotFoundError) {
          return reply.status(404).send({ error: `No default template for command: ${name}` });
        }
        throw err;
      }
    },
  );
}
