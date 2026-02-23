# VibeLint — Architecture & Implementation Plan (v4)

*A lightweight local tool for structured AI-assisted development*

---

## What VibeLint Is

A local web application where developers prepare, customize, and manage the files that make their AI coding agent work effectively — skills, platform rules (CLAUDE.md), slash commands, coding guidelines, and analysis reports. Then inject them into any repo.

VibeLint is a **workbench**, not a runtime service. It doesn't talk to the coding agent. It prepares files that the coding agent reads natively from the filesystem.

**Core components:**

1. **Dashboard** (localhost) — visual editor for skills, rules, slash commands, and platform config
2. **Analyzer** — static code quality analysis that writes reports the agent can reference
3. **Skills & Rules Manager** — edit, customize, and inject platform-specific files into repos
4. **vdoc Integration** — trigger and monitor feature-centric documentation
5. **Git Integration** — branch/PR stats, code review navigation, trend tracking

**The fundamental principle:** VibeLint prepares the context. The coding agent consumes it. The filesystem is the interface between them.

---

## User Flow

### Step 1: Install

```bash
npm install -g vibelint
```

One command. Globally available.

### Step 2: Start

```bash
vibelint
```

Starts the local server, opens browser to `http://localhost:3847`. First launch shows setup wizard.

### Step 3: Setup Wizard

**Panel 1 — Choose Your Coding Platform**

```
┌─────────────────────────────────────────────────────────┐
│  Which AI coding tool do you use?                        │
│                                                          │
│  ● Claude Code          ✅ Detected                     │
│  ○ Cursor               ✅ Detected                     │
│  ○ Windsurf             ○ Not detected                  │
│  ○ Gemini CLI           ○ Not detected                  │
│  ○ Antigravity          ○ Not detected                  │
│  ○ Other                                                 │
│                                                          │
│  This determines what files VibeLint generates:          │
│  Claude Code → CLAUDE.md + .claude/commands/*.md         │
│  Cursor → .cursor/rules/*.mdc + .cursor/mcp.json         │
│                                          [Next →]        │
└─────────────────────────────────────────────────────────┘
```

VibeLint auto-detects which tools are installed on the machine.

**Panel 2 — Connect Repositories**

```
┌─────────────────────────────────────────────────────────┐
│  Add your repositories                                   │
│                                                          │
│  [Browse...] or paste path: /Users/dev/projects/my-app   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  /Users/dev/projects/my-app                       │    │
│  │  Languages: TypeScript, Python                    │    │
│  │  Branches: 12 (current: feature/auth)             │    │
│  │  Existing files found:                            │    │
│  │    ✅ CLAUDE.md                                   │    │
│  │    ❌ LESSONS.md (not found)                      │    │
│  │    ❌ vdocs/ (not found)                          │    │
│  │    ❌ .vibelint/ (not found)                      │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  [+ Add Another Repo]                    [Next →]        │
└─────────────────────────────────────────────────────────┘
```

VibeLint immediately scans each repo: detects languages, checks for existing configuration files.

**Panel 3 — API Key (Optional)**

```
┌─────────────────────────────────────────────────────────┐
│  API Configuration (optional)                            │
│                                                          │
│  Your AI coding agent uses its own API key.              │
│  This key is only needed if you want VibeLint to         │
│  run AI-assisted features from the dashboard.            │
│                                                          │
│  AI Provider:     [Anthropic ▼]                         │
│  API Key:         [sk-...____________]                   │
│                                                          │
│  [Skip for now]                          [Finish →]      │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Dashboard Loads — Customize Before Injecting

This is the key insight: **VibeLint doesn't immediately inject files.** It first shows the user what it's going to create, lets them customize everything, and then injects on command.

```
┌─────────────────────────────────────────────────────────┐
│  VibeLint  │ Repos ▼ │ Skills │ Rules │ Analysis │ Docs │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  my-app — Ready to Initialize                            │
│                                                          │
│  VibeLint will create the following files in your repo.  │
│  Review and edit them before injecting.                   │
│                                                          │
│  ┌─ Platform Rules ────────────────────────────────┐    │
│  │  📄 CLAUDE.md                    [Edit] [Preview]│    │
│  │  📄 LESSONS.md (starter)         [Edit] [Preview]│    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─ Skills ────────────────────────────────────────┐    │
│  │  📄 general.md                   [Edit] [Preview]│    │
│  │  📄 typescript.md                [Edit] [Preview]│    │
│  │  📄 python.md                    [Edit] [Preview]│    │
│  │  📄 error-handling.md            [Edit] [Preview]│    │
│  │  📄 testing.md                   [Edit] [Preview]│    │
│  │  [+ Add Custom Skill]                            │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─ Slash Commands ────────────────────────────────┐    │
│  │  📄 /review   — Code review with analysis data  │    │
│  │  📄 /check    — Pre-commit quality checks        │    │
│  │  📄 /health   — Codebase health summary          │    │
│  │  📄 /vdoc-init — Generate documentation          │    │
│  │  📄 /vdoc-update — Refresh stale docs            │    │
│  │  [Edit All] [+ Add Custom Command]               │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─ Config ────────────────────────────────────────┐    │
│  │  📄 .vibelint/config.yml         [Edit]          │    │
│  │  Thresholds: complexity, duplication, file size   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Files will be .gitignored (local only).                 │
│                                                          │
│  [Inject into my-app]                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

The user clicks **Edit** on any file to open it in a built-in editor (markdown editor with preview). They can:

- Modify skill content (add project-specific patterns, remove irrelevant ones)
- Edit CLAUDE.md rules (add project-specific instructions)
- Customize slash commands (change the review workflow steps)
- Add entirely new skills or commands
- Adjust analysis thresholds

### Step 5: Inject

User clicks **"Inject into my-app"**. VibeLint:

1. Writes all prepared files into the repo:
   ```
   my-app/
   ├── CLAUDE.md                          ← platform rules
   ├── LESSONS.md                         ← starter template
   ├── .claude/
   │   └── commands/
   │       ├── review.md                  ← /review slash command
   │       ├── check.md                   ← /check slash command
   │       ├── health.md                  ← /health slash command
   │       ├── vdoc-init.md               ← /vdoc-init command
   │       └── vdoc-update.md             ← /vdoc-update command
   ├── .vibelint/
   │   ├── config.yml                     ← analysis thresholds
   │   ├── skills/
   │   │   ├── general.md
   │   │   ├── typescript.md
   │   │   ├── python.md
   │   │   ├── error-handling.md
   │   │   └── testing.md
   │   └── reports/                       ← analyzer writes here
   └── .gitignore                         ← updated to ignore .vibelint/, .claude/
   ```

2. Runs initial analysis (complexity, duplication, file sizes)
3. Writes baseline report to `.vibelint/reports/latest.md`
4. Stores metrics in VibeLint's SQLite database (for trending)
5. Dashboard transitions to the main monitoring view

### Step 6: Use

The user opens their coding agent in the repo directory. Everything works natively:

```
> /review          ← agent reads .vibelint/reports/latest.md + vdocs/ + does the review
> /check           ← agent reads .vibelint/config.yml + runs quality checks
> /health          ← agent reads .vibelint/reports/ + summarizes trends
> /vdoc-init       ← agent runs vdoc workflow to generate documentation
> /vdoc-update     ← agent refreshes stale docs
```

The agent reads CLAUDE.md and .vibelint/skills/ automatically because they're in the repo root (Claude Code reads CLAUDE.md by default, Cursor reads .cursorrules, etc.).

Meanwhile, the VibeLint dashboard stays available for:
- Viewing analysis results and trends
- Re-running analysis after code changes
- Editing and re-injecting skills/rules (if the user wants to update them)
- Monitoring vdoc freshness
- Navigating PRs and viewing code reviews

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  VibeLint Server                           │
│                (localhost:3847)                            │
│                                                           │
│  ┌──────────────────┐   ┌──────────────────┐             │
│  │  React SPA       │   │  Fastify API     │             │
│  │  (Dashboard)     │   │  (Backend)       │             │
│  │                  │   │                  │             │
│  │  • Skill editor  │   │  • File I/O      │             │
│  │  • Rules editor  │   │  • Git operations│             │
│  │  • Analysis view │   │  • Analyzer runs │             │
│  │  • PR navigator  │   │  • Config CRUD   │             │
│  │  • Trends charts │   │  • vdoc monitor  │             │
│  └──────────────────┘   └──────────────────┘             │
│                                │                          │
│  ┌─────────────────────────────┴────────────────────┐    │
│  │              Core Engine                           │    │
│  │                                                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │    │
│  │  │ Analyzer │ │ Injector │ │ Git      │          │    │
│  │  │          │ │          │ │ Connector│          │    │
│  │  └──────────┘ └──────────┘ └──────────┘          │    │
│  └───────────────────────────────────────────────────┘    │
│                                                           │
│  ┌───────────────────────────────────────────────────┐    │
│  │  Data Layer (SQLite)                               │    │
│  │  repos | metrics_history | analyses | config       │    │
│  └───────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────┐          ┌──────────────────────┐
│  User's Repos    │          │  Web Browser         │
│                  │          │  (Dashboard)          │
│  ← files written │          │                      │
│  ← files read    │          │                      │
└──────────────────┘          └──────────────────────┘
         │
         ▼
┌──────────────────────┐
│  User's AI Agent     │
│  (Claude Code, etc.) │
│                      │
│  Reads: CLAUDE.md,   │
│  skills/, commands/, │
│  reports/, vdocs/    │
└──────────────────────┘
```

### What Changed from Previous Versions

- **No MCP server.** The agent reads files from the filesystem. No live connection needed.
- **No RAG.** The agent reads vdoc files directly. No embedding or search layer.
- **Dashboard is the primary interface.** Not just monitoring — it's where skills and rules are authored and edited.
- **Inject on command.** Files are prepared in VibeLint, reviewed by the user, then written to the repo.
- **Gitignored.** All injected files are local-only. Each developer runs VibeLint themselves.

---

## Dashboard Pages

### 1. Repos Overview (Home)

Shows all connected repos with health cards.

- Health score (composite)
- Open branches / PRs
- Last analysis timestamp
- vdoc status (fresh / stale / missing)
- Quick actions: Run Analysis, Re-inject Skills, Open in Editor

### 2. Skills Editor

Full visual editor for all skill files.

```
┌─────────────────────────────────────────────────────────┐
│  Skills — my-app                                         │
│                                                          │
│  ┌─ Built-in Skills ──────────────────────────────┐     │
│  │  general.md          │ TS/JS │ Python │ Go │ ...│     │
│  │  error-handling.md   │                          │     │
│  │  testing.md          │                          │     │
│  │  naming.md           │                          │     │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─ Custom Skills ─────────────────────────────────┐    │
│  │  (none yet)          [+ Create New Skill]        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─ Editor ────────────────────────────────────────┐    │
│  │  # Error Handling Patterns                       │    │
│  │                                                   │    │
│  │  ## Rules                                         │    │
│  │  - Never use empty catch blocks                   │    │
│  │  - Always propagate errors or handle explicitly   │    │
│  │  - Log errors with context (operation, input)     │    │
│  │  ...                                              │    │
│  │                                                   │    │
│  │  [Save] [Reset to Default] [Preview as Rendered]  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  [Inject Updated Skills into my-app]                     │
└─────────────────────────────────────────────────────────┘
```

### 3. Rules Editor

Edit platform-specific rule files (CLAUDE.md, .cursorrules, etc.)

```
┌─────────────────────────────────────────────────────────┐
│  Platform Rules — my-app (Claude Code)                   │
│                                                          │
│  ┌─ CLAUDE.md ─────────────────────────────────────┐    │
│  │  # Project Rules                                  │    │
│  │                                                   │    │
│  │  ## Architecture                                  │    │
│  │  This project uses a layered architecture:        │    │
│  │  - /src/api — Express routes                      │    │
│  │  - /src/services — Business logic                 │    │
│  │  - /src/db — Database access layer                │    │
│  │  ...                                              │    │
│  │                                                   │    │
│  │  [Save] [Reset to Default]                        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─ Slash Commands ────────────────────────────────┐    │
│  │  /review     [Edit]                              │    │
│  │  /check      [Edit]                              │    │
│  │  /health     [Edit]                              │    │
│  │  /vdoc-init  [Edit]                              │    │
│  │  [+ Add Custom Command]                          │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─ LESSONS.md ────────────────────────────────────┐    │
│  │  (starter template — edit to add project lessons) │    │
│  │  [Edit]                                           │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  [Inject All into my-app]                                │
└─────────────────────────────────────────────────────────┘
```

### 4. Analysis View

Shows analysis results for a repo or specific branch.

- Summary table (complexity, duplication, file size, error handling, coupling)
- Per-file breakdown
- Diff view for branch comparisons
- Thresholds config (what triggers warnings/failures)
- "Run Analysis" button

### 5. PR / Branch Navigator

Browse branches, see diff stats, view analysis per branch.

- Branch list with diff stats vs main
- Click into a branch to see full analysis
- If AI review was generated (agent wrote to `.vibelint/reviews/`), display it
- File-level navigation with inline annotations

### 6. Trends

Historical metrics over time.

- Line charts: complexity, duplication, dependency count, file sizes
- Week-over-week comparison
- "Run Full Scan" button to capture a fresh snapshot

### 7. Docs (vdoc)

Monitor and trigger vdoc documentation.

```
┌─────────────────────────────────────────────────────────┐
│  Documentation — my-app                                  │
│                                                          │
│  vdoc Status: ⚠ 2 docs stale                            │
│                                                          │
│  ┌────────────────────┬──────────┬─────────────────┐    │
│  │ Document           │ Status   │ Last Updated     │    │
│  ├────────────────────┼──────────┼─────────────────┤    │
│  │ PROJECT_OVERVIEW   │ ✅ Fresh │ 3 days ago       │    │
│  │ AUTHENTICATION     │ ⚠ Stale │ 2 weeks ago      │    │
│  │ API_REFERENCE      │ ⚠ Stale │ 3 weeks ago      │    │
│  │ DATABASE_SCHEMA    │ ✅ Fresh │ 5 days ago       │    │
│  └────────────────────┴──────────┴─────────────────┘    │
│                                                          │
│  Stale = source files changed since doc was generated.   │
│  Use /vdoc-update in your coding agent to refresh.       │
│                                                          │
│  vdocs/ not found? Use /vdoc-init to generate docs.      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 8. Settings

API keys, platform selection, repo management, analysis thresholds.

---

## What Gets Injected Per Platform

### Claude Code

```
repo/
├── CLAUDE.md                           ← Claude reads this automatically
├── LESSONS.md                          ← referenced in CLAUDE.md
├── .claude/
│   └── commands/
│       ├── review.md                   ← /review
│       ├── check.md                    ← /check
│       ├── health.md                   ← /health
│       ├── vdoc-init.md                ← /vdoc-init
│       └── vdoc-update.md              ← /vdoc-update
├── .vibelint/
│   ├── config.yml                      ← analysis thresholds
│   ├── skills/
│   │   ├── general.md
│   │   ├── typescript.md
│   │   ├── error-handling.md
│   │   └── testing.md
│   └── reports/
│       └── latest.md                   ← written by analyzer
└── .gitignore                          ← updated
```

CLAUDE.md references the skills:
```markdown
# Project Rules

Read and follow these skill files:
- .vibelint/skills/general.md
- .vibelint/skills/typescript.md
- .vibelint/skills/error-handling.md
- .vibelint/skills/testing.md

Read LESSONS.md for project-specific lessons learned.

When doing code review, read .vibelint/reports/latest.md for analysis data.
```

### Cursor

```
repo/
├── .cursorrules                        ← Cursor reads this automatically
├── LESSONS.md
├── .cursor/
│   └── rules/
│       └── vibelint.mdc               ← detailed rules
├── .vibelint/
│   ├── config.yml
│   ├── skills/
│   └── reports/
└── .gitignore
```

### Windsurf

```
repo/
├── .windsurfrules                      ← Windsurf reads this automatically
├── LESSONS.md
├── .windsurf/
│   └── rules/
│       └── vibelint.md
├── .vibelint/
│   ├── config.yml
│   ├── skills/
│   └── reports/
└── .gitignore
```

### Generic (Gemini CLI, Antigravity, etc.)

```
repo/
├── AGENTS.md                           ← generic agent rules file
├── LESSONS.md
├── .vibelint/
│   ├── config.yml
│   ├── skills/
│   ├── reports/
│   └── prompts/                        ← prompt templates for manual use
└── .gitignore
```

---

## Analyzer Engine

Static analysis that runs from VibeLint's dashboard or on a schedule. Writes results to `.vibelint/reports/` so the coding agent can read them.

### Analysis Pipeline

| Check | Tool | Languages | Speed |
|-------|------|-----------|-------|
| Complexity (cyclomatic) | Lizard CLI | All 7 | Fast |
| Code duplication | jscpd | All 7 (150+ formats) | Medium |
| File size (lines) | Built-in | All | Instant |
| Function size | Regex heuristic | All | Instant |
| Error handling patterns | Regex | All | Fast |
| New dependency detection | Manifest diff | All | Instant |
| Coupling (files/dirs touched) | Git diff analysis | All | Instant |
| Dependency vulnerabilities | Package audit CLIs | Per-language | Slow |

### Output

The analyzer writes two things:

**1. `.vibelint/reports/latest.md`** — human and AI readable report:

```markdown
# Analysis Report — my-app
Generated: 2026-02-23 14:30

## Branch: feature/auth vs main
Files changed: 12 | +340 -28

## Summary
| Check | Status | Details |
|-------|--------|---------|
| Complexity | ⚠ WARN | +8 in auth.ts |
| Duplicates | ❌ FAIL | 3 clones (>10 lines) |
| Error Handling | ⚠ WARN | 2 empty catch blocks |
| New Deps | ✅ PASS | None |
| File Size | ⚠ WARN | auth.ts 482 lines |
| Coupling | ✅ PASS | 4 dirs, 12 files |

## Details
...
```

**2. SQLite database** — structured data for the dashboard and trending.

The `/review` slash command tells the agent: "Read `.vibelint/reports/latest.md` for analysis data before reviewing."

---

## vdoc Flow

vdoc has its own separate flow, triggered through slash commands or the dashboard.

### Initialize Documentation (First Time)

1. User sees "vdocs/ not found" on the dashboard Docs page
2. User opens their coding agent and types `/vdoc-init`
3. The slash command instructs the agent to run the vdoc init workflow:
   - Explore the codebase
   - Propose documentation plan
   - Wait for user approval
   - Generate feature docs
4. vdoc creates `vdocs/` with `_manifest.json` and feature docs
5. VibeLint detects the new files and updates the Docs page

### Update Stale Documentation

1. VibeLint checks file timestamps: if source files changed since a doc was generated, it's "stale"
2. Dashboard shows which docs are stale
3. User types `/vdoc-update` in their coding agent
4. Agent runs vdoc update workflow, refreshes stale docs
5. VibeLint detects the updated files

---

## Data Layer

SQLite database stored in VibeLint's data directory (not in the repo).

```sql
CREATE TABLE repos (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  languages TEXT,            -- JSON array
  platform TEXT,             -- 'claude-code', 'cursor', 'windsurf', etc.
  injected_at TEXT,          -- last injection timestamp
  created_at TEXT,
  last_scan_at TEXT
);

CREATE TABLE metrics_history (
  id INTEGER PRIMARY KEY,
  repo_id TEXT REFERENCES repos(id),
  timestamp TEXT,
  metrics TEXT               -- JSON blob
);

CREATE TABLE analyses (
  id INTEGER PRIMARY KEY,
  repo_id TEXT REFERENCES repos(id),
  branch TEXT,
  base_branch TEXT,
  diff_stats TEXT,           -- JSON
  analysis_data TEXT,        -- JSON
  created_at TEXT
);

CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT                 -- JSON
);
```

No reviews table — reviews are now just markdown files the agent writes to `.vibelint/reviews/` in the repo. VibeLint reads them from there.

---

## Technology Stack

| Component | Choice | Why |
|-----------|--------|-----|
| **Runtime** | Node.js (TypeScript) | Analysis tools are JS ecosystem |
| **Backend** | Fastify | Lightweight, fast, good TS support |
| **Frontend** | React + Vite | Simple SPA, fast builds |
| **Database** | SQLite (better-sqlite3) | Zero setup, single file |
| **Complexity** | Lizard | All 7 languages, single pip install |
| **Duplication** | jscpd | 150+ formats, npm native |
| **CSS** | Tailwind | Quick, consistent UI |
| **Markdown Editor** | CodeMirror or Monaco | In-browser editing with syntax highlighting |

### Runtime Dependencies (npm)

- `fastify` — HTTP server
- `better-sqlite3` — database
- `yaml` — config parsing
- A markdown editor component (CodeMirror, Monaco, or similar)

No MCP SDK. No embedding libraries. No vector database.

---

## Project Structure

```
vibelint/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── bin/
│   └── vibelint.ts                     # CLI entry point
├── src/
│   ├── server/
│   │   ├── index.ts                    # Fastify server
│   │   ├── api/
│   │   │   ├── repos.ts               # repo CRUD + scanning
│   │   │   ├── skills.ts              # skill file CRUD
│   │   │   ├── rules.ts               # platform rules CRUD
│   │   │   ├── commands.ts            # slash command CRUD
│   │   │   ├── analysis.ts            # trigger/view analysis
│   │   │   ├── inject.ts              # write files to repo
│   │   │   ├── trends.ts              # historical metrics
│   │   │   ├── docs.ts                # vdoc status
│   │   │   └── config.ts              # settings
│   │   ├── analyzer/
│   │   │   ├── engine.ts
│   │   │   ├── complexity.ts
│   │   │   ├── duplication.ts
│   │   │   ├── error-patterns.ts
│   │   │   ├── dependencies.ts
│   │   │   ├── file-size.ts
│   │   │   ├── coupling.ts
│   │   │   └── languages/
│   │   │       └── detector.ts
│   │   ├── injector/
│   │   │   ├── index.ts               # orchestrates injection
│   │   │   └── platforms/
│   │   │       ├── claude-code.ts     # generates .claude/ files
│   │   │       ├── cursor.ts          # generates .cursor/ files
│   │   │       ├── windsurf.ts
│   │   │       └── generic.ts
│   │   ├── git/
│   │   │   ├── scanner.ts             # detect languages, branches
│   │   │   ├── diff.ts
│   │   │   └── history.ts
│   │   ├── vdoc/
│   │   │   └── monitor.ts             # check doc freshness
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── queries.ts
│   │   └── utils/
│   │       └── exec.ts
│   │
│   └── client/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       ├── pages/
│       │   ├── Dashboard.tsx           # repo overview
│       │   ├── SkillsEditor.tsx        # edit skills
│       │   ├── RulesEditor.tsx         # edit CLAUDE.md, commands
│       │   ├── AnalysisView.tsx        # analysis results
│       │   ├── PRNavigator.tsx         # branch/PR browser
│       │   ├── Trends.tsx              # charts
│       │   ├── DocsStatus.tsx          # vdoc monitoring
│       │   └── Settings.tsx
│       ├── components/
│       │   ├── MarkdownEditor.tsx      # CodeMirror/Monaco wrapper
│       │   ├── FilePreview.tsx
│       │   ├── MetricCard.tsx
│       │   ├── AnalysisSummary.tsx
│       │   ├── DiffViewer.tsx
│       │   └── TrendChart.tsx
│       └── lib/
│           └── api.ts
│
├── templates/                          # default file templates
│   ├── skills/
│   │   ├── general.md
│   │   ├── typescript.md
│   │   ├── python.md
│   │   ├── go.md
│   │   ├── java.md
│   │   ├── rust.md
│   │   ├── csharp.md
│   │   ├── ruby.md
│   │   ├── error-handling.md
│   │   └── testing.md
│   ├── rules/
│   │   ├── claude-code/
│   │   │   └── CLAUDE.md.template
│   │   ├── cursor/
│   │   │   └── cursorrules.template
│   │   ├── windsurf/
│   │   │   └── windsurfrules.template
│   │   └── generic/
│   │       └── AGENTS.md.template
│   ├── commands/
│   │   ├── claude-code/
│   │   │   ├── review.md
│   │   │   ├── check.md
│   │   │   ├── health.md
│   │   │   ├── vdoc-init.md
│   │   │   └── vdoc-update.md
│   │   └── generic/
│   │       └── ...
│   └── config/
│       ├── config.yml.template
│       └── LESSONS.md.template
│
├── tests/
│   ├── server/
│   ├── analyzer/
│   └── fixtures/
│
└── data/                               # VibeLint's own data (not in repos)
    └── vibelint.db
```

---

## Implementation Roadmap

### Sprint 1: Foundation (Week 1-2)

**Goal:** Server starts, dashboard loads, can add repos, basic settings.

1. Project scaffold (TS, Fastify, Vite, React, Tailwind)
2. CLI entry point (`vibelint` command starts server + opens browser)
3. SQLite database schema and data layer
4. REST API: repo CRUD (add/remove/list, scan for languages)
5. REST API: config (save/load settings)
6. Frontend: Setup wizard (platform picker, repo adder, API key)
7. Frontend: Dashboard home with repo cards
8. Git scanner: detect languages, list branches, check for existing files

**Deliverable:** `npm install -g vibelint && vibelint` → wizard → repos connected

### Sprint 2: Skills & Rules Editor (Week 3-4)

**Goal:** Full visual editor for skills, rules, and slash commands. Inject into repos.

1. Template system (load default skills/rules/commands from templates/)
2. REST API: skill CRUD (list, read, update, create custom)
3. REST API: rules CRUD (CLAUDE.md, LESSONS.md, platform rules)
4. REST API: slash command CRUD
5. REST API: inject endpoint (writes all files to repo)
6. Frontend: Skills Editor page (markdown editor + preview)
7. Frontend: Rules Editor page (CLAUDE.md + commands editor)
8. Frontend: "Inject" button with file preview
9. Injector: platform-specific file generators (Claude Code, Cursor, Windsurf, generic)
10. Gitignore updater (add .vibelint/, .claude/, etc.)

**Deliverable:** Edit skills in browser, click inject, files appear in repo. Agent reads them.

### Sprint 3: Analyzer Engine (Week 5-6)

**Goal:** Static analysis runs, results on dashboard and in .vibelint/reports/.

1. Lizard wrapper (complexity per file/function)
2. jscpd wrapper (duplication detection)
3. Error handling regex patterns (per language)
4. File size + function size checks
5. Dependency manifest diff detection
6. Coupling analysis (files/dirs from git diff)
7. Analysis pipeline orchestrator
8. Report writer (generates .vibelint/reports/latest.md)
9. REST API: analysis endpoints (trigger, view results)
10. Frontend: Analysis View page with summary table + per-file detail

**Deliverable:** Run analysis from dashboard, see results, agent reads report during /review

### Sprint 4: PR Navigation + vdoc (Week 7-8)

**Goal:** Browse branches/PRs with analysis. vdoc freshness monitoring.

1. Git diff parser (branch comparison)
2. Branch/PR list from local git
3. Per-branch analysis (run analyzer on any branch vs main)
4. REST API: branches, PR list, per-branch analysis
5. Frontend: PR Navigator page (branch list → diff view → analysis)
6. vdoc freshness monitor (compare file timestamps to git history)
7. REST API: docs status endpoint
8. Frontend: Docs Status page (fresh/stale indicators, instructions)
9. Review file watcher (detect agent-written reviews in .vibelint/reviews/)
10. Frontend: display reviews alongside analysis

**Deliverable:** Full PR workflow on dashboard. vdoc status visible.

### Sprint 5: Trends + Polish (Week 9-10)

**Goal:** Historical tracking, polish, documentation.

1. Metric snapshot scheduler (daily or on-demand)
2. Trend computation (week-over-week deltas)
3. Frontend: Trends page with line charts
4. Pre-commit hook installer (optional)
5. Full codebase scan mode
6. Export analysis reports as markdown/JSON
7. Error handling and edge cases
8. Performance optimization for large repos
9. README, setup guide, contributing guide
10. npm publish setup

**Deliverable:** Complete product. `npm install -g vibelint` works.

---

## Summary: What VibeLint Is and Isn't

**IS:**
- A workbench for preparing AI coding context (skills, rules, commands)
- A visual editor for CLAUDE.md, .cursorrules, slash commands, skill files
- A static code analyzer that writes reports the agent can read
- A dashboard for monitoring repo health, trends, doc freshness
- A file injector that writes platform-specific config into repos

**ISN'T:**
- A runtime service the agent talks to (no MCP, no API calls from agent)
- A RAG system (agent reads files directly)
- An AI itself (all AI work done by user's coding agent)
- A replacement for the coding agent (it augments the agent with structured context)

---

*VibeLint: the workbench for vibecoding. Prepare the context. Inject it. Let your AI agent do the rest.*
