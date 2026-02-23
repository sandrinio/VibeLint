import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getConfig, setConfig, deleteConfig, getRepo } from '../db/queries.js';
import { loadTemplate, TemplateNotFoundError } from '../templates/loader.js';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

const VALID_RULE_TYPES = ['claude-md', 'cursorrules', 'windsurfrules', 'agents-md', 'lessons-md'] as const;
type RuleType = typeof VALID_RULE_TYPES[number];

interface RuleResponse {
  type: string;
  displayName: string;
  content: string;
  isDefault: boolean;
  isModified: boolean;
}

const RULE_TEMPLATE_MAP: Record<RuleType, { category: string; file: string; displayName: string }> = {
  'claude-md':     { category: 'rules/claude-code', file: 'CLAUDE.md.template', displayName: 'CLAUDE.md' },
  'cursorrules':   { category: 'rules/cursor',      file: 'cursorrules.template', displayName: '.cursorrules' },
  'windsurfrules': { category: 'rules/windsurf',    file: 'windsurfrules.template', displayName: '.windsurfrules' },
  'agents-md':     { category: 'rules/generic',     file: 'AGENTS.md.template', displayName: 'AGENTS.md' },
  'lessons-md':    { category: 'config',            file: 'LESSONS.md.template', displayName: 'LESSONS.md' },
};

const PLATFORM_RULE_MAP: Record<string, RuleType> = {
  'claude-code': 'claude-md',
  'cursor': 'cursorrules',
  'windsurf': 'windsurfrules',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidRuleType(value: string): value is RuleType {
  return (VALID_RULE_TYPES as readonly string[]).includes(value);
}

function configKey(repoId: string, type: RuleType): string {
  return `rules:${repoId}:${type}`;
}

/**
 * Build a RuleResponse for the given type.
 * Checks config for a custom override first; falls back to the default template.
 */
function buildRuleResponse(repoId: string, type: RuleType): RuleResponse {
  const mapping = RULE_TEMPLATE_MAP[type];
  const custom = getConfig(configKey(repoId, type));

  if (custom !== undefined) {
    return {
      type,
      displayName: mapping.displayName,
      content: custom,
      isDefault: false,
      isModified: true,
    };
  }

  // Fall back to default template
  const template = loadTemplate(mapping.category, mapping.file);
  return {
    type,
    displayName: mapping.displayName,
    content: template.content,
    isDefault: true,
    isModified: false,
  };
}

// ---------------------------------------------------------------------------
// Fastify Plugin
// ---------------------------------------------------------------------------

export default async function rulesRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/repos/:repoId/rules
  fastify.get('/api/repos/:repoId/rules', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoId } = request.params as { repoId: string };

    const repo = getRepo(repoId);
    if (!repo) {
      return reply.status(404).send({ error: `Repo not found: ${repoId}` });
    }

    // Determine the platform-specific rule type
    const platformRuleType: RuleType = (repo.platform && PLATFORM_RULE_MAP[repo.platform])
      ? PLATFORM_RULE_MAP[repo.platform]
      : 'agents-md';

    const platformRule = buildRuleResponse(repoId, platformRuleType);
    const lessonsRule = buildRuleResponse(repoId, 'lessons-md');

    return [platformRule, lessonsRule];
  });

  // GET /api/repos/:repoId/rules/:type
  fastify.get('/api/repos/:repoId/rules/:type', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoId, type } = request.params as { repoId: string; type: string };

    const repo = getRepo(repoId);
    if (!repo) {
      return reply.status(404).send({ error: `Repo not found: ${repoId}` });
    }

    if (!isValidRuleType(type)) {
      return reply.status(400).send({ error: `Invalid rule type: ${type}. Valid types: ${VALID_RULE_TYPES.join(', ')}` });
    }

    try {
      return buildRuleResponse(repoId, type);
    } catch (err) {
      if (err instanceof TemplateNotFoundError) {
        return reply.status(500).send({ error: `Default template not found for rule type: ${type}` });
      }
      throw err;
    }
  });

  // PUT /api/repos/:repoId/rules/:type
  fastify.put('/api/repos/:repoId/rules/:type', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoId, type } = request.params as { repoId: string; type: string };

    const repo = getRepo(repoId);
    if (!repo) {
      return reply.status(404).send({ error: `Repo not found: ${repoId}` });
    }

    if (!isValidRuleType(type)) {
      return reply.status(400).send({ error: `Invalid rule type: ${type}. Valid types: ${VALID_RULE_TYPES.join(', ')}` });
    }

    const { content } = request.body as { content: string };
    if (content === undefined || content === null || typeof content !== 'string') {
      return reply.status(400).send({ error: 'Missing or invalid "content" in request body.' });
    }

    setConfig(configKey(repoId, type), content);

    const mapping = RULE_TEMPLATE_MAP[type];
    return {
      type,
      displayName: mapping.displayName,
      content,
      isDefault: false,
      isModified: true,
    } satisfies RuleResponse;
  });

  // POST /api/repos/:repoId/rules/:type/reset
  fastify.post('/api/repos/:repoId/rules/:type/reset', async (request: FastifyRequest, reply: FastifyReply) => {
    const { repoId, type } = request.params as { repoId: string; type: string };

    const repo = getRepo(repoId);
    if (!repo) {
      return reply.status(404).send({ error: `Repo not found: ${repoId}` });
    }

    if (!isValidRuleType(type)) {
      return reply.status(400).send({ error: `Invalid rule type: ${type}. Valid types: ${VALID_RULE_TYPES.join(', ')}` });
    }

    // Delete the custom override
    deleteConfig(configKey(repoId, type));

    // Load and return the default template
    const mapping = RULE_TEMPLATE_MAP[type];
    try {
      const template = loadTemplate(mapping.category, mapping.file);
      return {
        type,
        displayName: mapping.displayName,
        content: template.content,
        isDefault: true,
        isModified: false,
      } satisfies RuleResponse;
    } catch (err) {
      if (err instanceof TemplateNotFoundError) {
        return reply.status(500).send({ error: `Default template not found for rule type: ${type}` });
      }
      throw err;
    }
  });
}
