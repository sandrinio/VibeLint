# EPIC-001: Project Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Ambiguity** | Low |
| **Context Source** | [PRD v4](../PRD.md) — Sprint 1: Foundation |
| **Owner** | Engineering |
| **Priority** | P0 - Critical |
| **Tags** | #foundation, #scaffold, #cli, #server, #database |
| **Target Date** | TBD |

---

## 1. Problem & Value
> Target Audience: Stakeholders, Business Sponsors

### 1.1 The Problem
VibeLint does not exist yet. There is no project structure, no build pipeline, no server, no database, and no CLI entry point. Every subsequent epic depends on this foundation being solid and correctly configured.

### 1.2 The Solution
Scaffold the complete project with TypeScript, Fastify backend, Vite + React + Tailwind frontend, SQLite database, and a CLI entry point (`vibelint` command). Establish the monorepo-style structure, dev tooling, and build pipeline so that all future epics can build incrementally on a working base.

### 1.3 Success Metrics (North Star)
- `npm install` succeeds with zero errors
- `npm run dev` starts Fastify server on `localhost:3847` and serves the React SPA
- `vibelint` CLI command starts the server and opens the browser
- SQLite database is created on first launch with the correct schema
- TypeScript compiles cleanly with strict mode

---

## 2. Scope Boundaries
> Target Audience: AI Agents (Critical for preventing hallucinations)

### IN-SCOPE (Build This)
- [ ] Initialize `package.json` with project metadata and scripts
- [ ] Configure TypeScript (`tsconfig.json`) with strict mode, path aliases
- [ ] Configure Vite (`vite.config.ts`) with React plugin and proxy to Fastify
- [ ] Set up Tailwind CSS with base config
- [ ] Create CLI entry point (`bin/vibelint.ts`) that starts server + opens browser
- [ ] Create Fastify server (`src/server/index.ts`) with CORS, static serving
- [ ] Create SQLite database schema (`src/server/db/schema.ts`) — repos, metrics_history, analyses, config tables
- [ ] Create database query helpers (`src/server/db/queries.ts`)
- [ ] Create React app shell (`src/client/App.tsx`) with routing placeholder
- [ ] Create `src/client/index.html` entry point
- [ ] Set up directory structure per PRD project structure
- [ ] Add `.gitignore` for node_modules, dist, data/

### OUT-OF-SCOPE (Do NOT Build This)
- Setup wizard UI (EPIC-002)
- Repo scanning / platform detection (EPIC-002)
- Any REST API endpoints beyond health check (EPIC-002+)
- Skills, rules, or template content (EPIC-003)
- Analyzer engine (EPIC-005)

---

## 3. Context

### 3.1 User Personas
- **Developer**: Needs a clean, well-structured project to build features on
- **End User**: Expects `npm install -g vibelint && vibelint` to just work

### 3.2 Constraints
| Type | Constraint |
|------|------------|
| **Runtime** | Node.js (TypeScript) |
| **Backend** | Fastify |
| **Frontend** | React + Vite + Tailwind |
| **Database** | SQLite via `better-sqlite3` |
| **Port** | `localhost:3847` |
| **Package** | Must support global npm install |

---

## 4. Technical Context
> Target Audience: AI Agents — READ THIS before decomposing.

### 4.1 Affected Areas
| Area | Files/Modules | Change Type |
|------|---------------|-------------|
| Root config | `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore` | Create |
| CLI | `bin/vibelint.ts` | Create |
| Server | `src/server/index.ts` | Create |
| Database | `src/server/db/schema.ts`, `src/server/db/queries.ts` | Create |
| Client shell | `src/client/index.html`, `src/client/main.tsx`, `src/client/App.tsx` | Create |
| Utilities | `src/server/utils/exec.ts` | Create |

### 4.2 Dependencies
| Type | Dependency | Status |
|------|------------|--------|
| **Requires** | Node.js >= 18 | Assumed |
| **Unlocks** | EPIC-002 (Setup Wizard) | Waiting |
| **Unlocks** | All subsequent epics | Waiting |

### 4.3 Integration Points
| System | Purpose | Notes |
|--------|---------|-------|
| npm registry | Global install | `bin` field in package.json |
| `better-sqlite3` | Database | Native module, requires build tools |
| `open` (npm) | Browser launch | CLI opens browser on startup |

---

## 5. Decomposition Guidance
> Hints for AI story breakdown. Check all that apply.

- [x] **Schema/Migration** - SQLite schema creation
- [ ] **API Work** - Health check endpoint only
- [ ] **UI Work** - App shell only (no real UI)
- [ ] **Integration** - No external services
- [ ] **Bug Fixes** - Greenfield
- [ ] **Hygiene** - N/A
- [ ] **Testing** - Basic smoke tests

### Suggested Story Sequence
1. **STORY-001-01**: Initialize package.json, tsconfig, .gitignore, directory structure
2. **STORY-001-02**: Set up Vite + React + Tailwind with app shell
3. **STORY-001-03**: Create Fastify server with health check and static file serving
4. **STORY-001-04**: Create SQLite database schema and query layer
5. **STORY-001-05**: Create CLI entry point (starts server, opens browser)

---

## 6. Risks & Edge Cases
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `better-sqlite3` native build fails on some platforms | Medium | Document required build tools (python, make, gcc) |
| Port 3847 already in use | Low | Add port conflict detection with helpful error message |
| Vite proxy to Fastify misconfigured | Medium | Test dev mode proxy early |
| Global install path issues on Windows | Low | Test with `npx vibelint` as fallback |

---

## 7. Acceptance Criteria (Epic-Level)
> How do we know the EPIC is complete? Full user flow.

```gherkin
Feature: Project Foundation

  Scenario: Dev environment starts
    Given the developer has cloned the repo
    When they run "npm install" and "npm run dev"
    Then Fastify starts on localhost:3847
    And the React SPA loads in the browser
    And the health check endpoint responds with 200

  Scenario: Database initializes on first launch
    Given no vibelint.db file exists
    When the server starts
    Then SQLite database is created with repos, metrics_history, analyses, config tables
    And the schema matches the PRD specification

  Scenario: CLI entry point works
    Given vibelint is installed globally
    When the user runs "vibelint"
    Then the server starts on localhost:3847
    And the default browser opens to localhost:3847

  Scenario: TypeScript compiles cleanly
    Given the project source files
    When "npm run build" is executed
    Then TypeScript compilation succeeds with zero errors
```

---

## 8. Open Questions
| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| Use ESM or CJS for the project? | A: ESM (modern, Vite-native), B: CJS (broader compat) | Build config, imports | Eng | Leaning A |
| Include ESLint/Prettier in foundation? | A: Yes (enforce from day 1), B: No (add later) | Dev workflow | Eng | Leaning A |
| Where to store SQLite DB? | A: `~/.vibelint/vibelint.db` (user home), B: `./data/vibelint.db` (project dir) | Data persistence | Eng | Leaning A |

---

## 9. Artifact Links
> Auto-populated as Epic is decomposed.

**Stories:**
- [ ] STORY-001-01: Project Config & Directory Structure
- [ ] STORY-001-02: Vite + React + Tailwind App Shell
- [ ] STORY-001-03: Fastify Server with Health Check
- [ ] STORY-001-04: SQLite Database Schema & Query Layer
- [ ] STORY-001-05: CLI Entry Point

**References:**
- PRD: [PRD.md](../PRD.md)
- PRD Project Structure: PRD.md lines 664-777
- PRD Technology Stack: PRD.md lines 638-658
- PRD Sprint 1: PRD.md lines 783-796
