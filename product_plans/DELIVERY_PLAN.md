# VibeLint Delivery Plan

*Iterative delivery across 7 milestones, 9 epics, 64 stories.*

---

## Dependency Graph

```
EPIC-001 Foundation
    │
    ▼
EPIC-002 Setup Wizard & Repos
    │
    ├──────────────────────────────────┐
    ▼                                  ▼
EPIC-003 Skills & Rules Editor    EPIC-007 vdoc Integration ←── (parallel track)
    │
    ▼
EPIC-004 File Injection
    │
    ▼
EPIC-005 Analyzer Engine
    │
    ├─────────────────┐
    ▼                 ▼
EPIC-006 PR Nav   EPIC-008 Trends  ←── (parallel tracks)
    │                 │
    └────────┬────────┘
             ▼
EPIC-009 Polish & Distribution
```

**Critical Path:** 001 → 002 → 003 → 004 → 005 → 009

**Parallel Tracks (off critical path):**
- EPIC-007 branches off after EPIC-002
- EPIC-006 and EPIC-008 branch off after EPIC-005

---

## Milestone 1: "It Runs"

> **Goal:** `npm run dev` starts Fastify + React, browser opens, DB initializes.
> **Epic:** EPIC-001 (5 stories, sequential)

| Order | Story | Title | Actor | Depends On |
|-------|-------|-------|-------|------------|
| 1 | STORY-001-01 | Project Config & Directory Structure | Full-Stack | — |
| 2 | STORY-001-02 | Vite + React + Tailwind App Shell | Frontend | 001-01 |
| 3 | STORY-001-03 | Fastify Server with Health Check | Backend | 001-01 |
| 4 | STORY-001-04 | SQLite Database Schema & Query Layer | Backend | 001-01 |
| 5 | STORY-001-05 | CLI Entry Point | Full-Stack | 001-03 |

```
001-01 ──→ 001-02
       ├─→ 001-03 ──→ 001-05
       └─→ 001-04
```

**Parallelism:** After STORY-001-01, stories 02/03/04 can run in parallel (frontend shell, server, DB are independent). Story 05 waits on 03 only.

**Deliverable:** Server on localhost:3847, React shell loads, SQLite DB created at `~/.vibelint/vibelint.db`, `vibelint` CLI opens browser.

---

## Milestone 2: "It Knows Your Repos"

> **Goal:** First-launch wizard, repo scanning, dashboard with repo cards.
> **Epic:** EPIC-002 (6 stories)

| Order | Story | Title | Actor | Depends On |
|-------|-------|-------|-------|------------|
| 1a | STORY-002-01 | Git Scanner | Backend | M1 complete |
| 1b | STORY-002-02 | Platform Detection | Backend | M1 complete |
| 2a | STORY-002-03 | Repo CRUD API | Backend | 002-01 |
| 2b | STORY-002-04 | Config API | Backend | — (M1 only) |
| 3a | STORY-002-05 | Setup Wizard UI | Frontend | 002-02, 002-03, 002-04 |
| 3b | STORY-002-06 | Dashboard Home with Repo Cards | Frontend | 002-03 |

```
002-01 ──→ 002-03 ──→ 002-05
002-02 ─────────────↗
002-04 ─────────────↗
002-03 ──→ 002-06
```

**Parallelism:**
- Wave 1: 002-01 + 002-02 + 002-04 (all independent backend)
- Wave 2: 002-03 (needs scanner)
- Wave 3: 002-05 + 002-06 (both frontend, independent of each other)

**Deliverable:** Launch → wizard → select platform → add repos → dashboard shows repo cards with languages and branches.

---

## Milestone 3: "It Has Content"

> **Goal:** Author and customize skills, rules, slash commands in the browser.
> **Epic:** EPIC-003 (9 stories)

| Order | Story | Title | Actor | Depends On |
|-------|-------|-------|-------|------------|
| 1a | STORY-003-01 | Template System | Backend | M2 complete |
| 1b | STORY-003-02 | Skill Templates (10 files) | Full-Stack | — |
| 1c | STORY-003-03 | Rule & Command Templates | Full-Stack | — |
| 2a | STORY-003-04 | Skills CRUD API | Backend | 003-01, 003-02 |
| 2b | STORY-003-05 | Rules CRUD API | Backend | 003-01, 003-03 |
| 2c | STORY-003-06 | Commands CRUD API | Backend | 003-01, 003-03 |
| 2d | STORY-003-07 | Markdown Editor Component | Frontend | — |
| 3a | STORY-003-08 | Skills Editor Page | Frontend | 003-04, 003-07 |
| 3b | STORY-003-09 | Rules Editor Page | Frontend | 003-05, 003-06, 003-07 |

```
003-01 ──→ 003-04 ──→ 003-08
003-02 ───↗           ↗
003-03 ──→ 003-05 ──→ 003-09
       └─→ 003-06 ──↗
003-07 ──────────────↗
```

**Parallelism:**
- Wave 1: 003-01 + 003-02 + 003-03 + 003-07 (all four independent — templates + editor component)
- Wave 2: 003-04 + 003-05 + 003-06 (three CRUD APIs, independent of each other)
- Wave 3: 003-08 + 003-09 (editor pages, independent of each other)

**Deliverable:** Open Skills Editor → see default skills for detected languages → edit in CodeMirror → save. Same for CLAUDE.md, slash commands, LESSONS.md.

---

## Milestone 4: "It Writes to Repos"

> **Goal:** Click "Inject" and all platform-specific files appear in the repo.
> **Epic:** EPIC-004 (7 stories)

| Order | Story | Title | Actor | Depends On |
|-------|-------|-------|-------|------------|
| 1 | STORY-004-01 | Injector Orchestrator | Backend | M3 complete |
| 2a | STORY-004-02 | Claude Code Injector | Backend | 004-01 |
| 2b | STORY-004-03 | Cursor Injector | Backend | 004-01 |
| 2c | STORY-004-04 | Windsurf & Generic Injectors | Backend | 004-01 |
| 2d | STORY-004-05 | Gitignore Updater | Backend | 004-01 |
| 3 | STORY-004-06 | Inject & Preview API | Backend | 004-02..05 |
| 4 | STORY-004-07 | Inject UI (Button, Preview, Status) | Frontend | 004-06 |

```
004-01 ──→ 004-02 ──→ 004-06 ──→ 004-07
       ├─→ 004-03 ──↗
       ├─→ 004-04 ──↗
       └─→ 004-05 ──↗
```

**Parallelism:**
- Wave 1: 004-01 (orchestrator foundation)
- Wave 2: 004-02 + 004-03 + 004-04 + 004-05 (all four independent platform injectors + gitignore)
- Wave 3: 004-06 (API, needs all injectors)
- Wave 4: 004-07 (UI)

**Deliverable:** Click "Inject into my-app" → preview modal → confirm → CLAUDE.md + .claude/commands/ + .vibelint/ written → .gitignore updated. AI coding agent reads files natively.

---

## Milestone 5: "It Analyzes Code"

> **Goal:** Run static analysis, see results on dashboard, agent reads report during /review.
> **Epic:** EPIC-005 (10 stories)

| Order | Story | Title | Actor | Depends On |
|-------|-------|-------|-------|------------|
| 1 | STORY-005-01 | Language Detector | Backend | M4 complete |
| 2a | STORY-005-02 | File & Function Size Checker | Backend | 005-01 |
| 2b | STORY-005-03 | Error Handling Pattern Detector | Backend | 005-01 |
| 2c | STORY-005-04 | Complexity Analysis (Lizard) | Backend | 005-01 |
| 2d | STORY-005-05 | Duplication Detection (jscpd) | Backend | 005-01 |
| 2e | STORY-005-06 | Dependency Detection | Backend | — |
| 2f | STORY-005-07 | Coupling Analysis | Backend | — |
| 3 | STORY-005-08 | Analysis Engine & Report Writer | Backend | 005-01..07 |
| 4 | STORY-005-09 | Analysis API | Backend | 005-08 |
| 5 | STORY-005-10 | Analysis View UI | Frontend | 005-09 |

```
005-01 ──→ 005-02 ──→ 005-08 ──→ 005-09 ──→ 005-10
       ├─→ 005-03 ──↗
       ├─→ 005-04 ──↗
       └─→ 005-05 ──↗
005-06 ─────────────↗
005-07 ─────────────↗
```

**Parallelism:**
- Wave 1: 005-01 + 005-06 + 005-07 (language detector + dep detection + coupling are independent)
- Wave 2: 005-02 + 005-03 + 005-04 + 005-05 (four analyzers, all independent, can run with wave 1's 06+07)
- Wave 3: 005-08 (engine orchestrates all)
- Wave 4: 005-09 + 005-10 (API then UI)

**Maximum parallelism in wave 1+2:** Up to 6 analyzer stories can be built simultaneously.

**Deliverable:** Click "Run Analysis" → complexity, duplication, error handling, file size, dependencies, coupling → summary table with pass/warn/fail → `.vibelint/reports/latest.md` written → `/review` command references analysis data.

---

## Milestone 6: "Full Feature Set"

> **Goal:** PR navigation, vdoc monitoring, historical trends — all three tracks in parallel.
> **Epics:** EPIC-006 + EPIC-007 + EPIC-008 (17 stories total, 3 parallel tracks)

### Track A: EPIC-006 — PR & Branch Navigation (7 stories)

| Order | Story | Title | Actor | Depends On |
|-------|-------|-------|-------|------------|
| 1a | STORY-006-01 | Git Diff Parser | Backend | M5 complete |
| 1b | STORY-006-02 | Git History Utilities | Backend | M5 complete |
| 2 | STORY-006-03 | Branch Listing API | Backend | 006-01, 006-02 |
| 3a | STORY-006-04 | Per-Branch Analysis API | Backend | 006-03 |
| 3b | STORY-006-05 | Review File Reader | Backend | — |
| 4a | STORY-006-06 | PR Navigator Page | Frontend | 006-03, 006-04, 006-05 |
| 4b | STORY-006-07 | DiffViewer Component | Frontend | 006-01 |

### Track B: EPIC-007 — vdoc Integration (4 stories)

> **Note:** This track can start as early as Milestone 2 (only needs EPIC-002).
> Scheduled here to batch with other secondary features, but can be pulled forward.

| Order | Story | Title | Actor | Depends On |
|-------|-------|-------|-------|------------|
| 1 | STORY-007-01 | vdoc Manifest Parser | Backend | M2 complete |
| 2 | STORY-007-02 | Freshness Monitor | Backend | 007-01 |
| 3 | STORY-007-03 | Docs Status API | Backend | 007-02 |
| 4 | STORY-007-04 | Docs Status Page | Frontend | 007-03 |

### Track C: EPIC-008 — Trends & Historical Metrics (6 stories)

| Order | Story | Title | Actor | Depends On |
|-------|-------|-------|-------|------------|
| 1 | STORY-008-01 | Metric Snapshot System | Backend | M5 complete |
| 2 | STORY-008-02 | Trend Computation | Backend | 008-01 |
| 3 | STORY-008-03 | Trends API | Backend | 008-02 |
| 4a | STORY-008-04 | TrendChart Component | Frontend | — |
| 4b | STORY-008-05 | Trends Page | Frontend | 008-03, 008-04 |
| 5 | STORY-008-06 | Dashboard Trend Indicators | Frontend | 008-03 |

**Cross-track parallelism:** All three tracks are fully independent. With 2-3 developers, assign one track each.

**Deliverable:** Browse branches with diff stats, run per-branch analysis, view AI reviews, monitor vdoc freshness, see trend charts over time, dashboard shows quality trajectory.

---

## Milestone 7: "Ship It"

> **Goal:** Production-grade quality, npm publish, cross-platform support, version management.
> **Epic:** EPIC-009 (10 stories)

| Order | Story | Title | Actor | Depends On |
|-------|-------|-------|-------|------------|
| 1a | STORY-009-01 | Error Handling Audit | Full-Stack | M6 complete |
| 1b | STORY-009-02 | Performance Optimization | Full-Stack | M6 complete |
| 1c | STORY-009-08 | Cross-Platform Compatibility | Backend | M6 complete |
| 2a | STORY-009-03 | Full Codebase Scan Mode | Full-Stack | 009-01 |
| 2b | STORY-009-04 | Export Analysis Reports | Full-Stack | 009-01 |
| 2c | STORY-009-05 | Pre-Commit Hook Installer | Full-Stack | 009-01 |
| 2d | STORY-009-06 | Settings Page | Frontend | 009-01 |
| 3a | STORY-009-07 | npm Publish Setup | Full-Stack | 009-01..08 |
| 3b | STORY-009-09 | Version Check & Update Notification | Full-Stack | 009-07 |
| 3c | STORY-009-10 | Changelog System | Full-Stack | 009-07 |

```
009-01 ──→ 009-03
       ├─→ 009-04
       ├─→ 009-05
       └─→ 009-06
009-02 (parallel)        ──→ 009-07 ──→ 009-09
009-08 (parallel)        ──↗        └─→ 009-10
```

**Parallelism:**
- Wave 1: 009-01 + 009-02 + 009-08 (three independent quality tracks)
- Wave 2: 009-03 + 009-04 + 009-05 + 009-06 (four features, independent)
- Wave 3: 009-07 (publish setup, needs everything done)
- Wave 4: 009-09 + 009-10 (version management + changelog, both need npm publish done first)

**Deliverable:** `npm install -g vibelint && vibelint` works on macOS, Linux, Windows. Clean error handling, fast performance, export reports, optional pre-commit hooks. Users notified of updates, can self-update, and view changelog.

---

## Summary: Story Count by Milestone

| Milestone | Epic(s) | Stories | Parallel Tracks | Cumulative |
|-----------|---------|---------|-----------------|------------|
| **M1** — It Runs | 001 | 5 | 1 | 5 |
| **M2** — It Knows Your Repos | 002 | 6 | 1 | 11 |
| **M3** — It Has Content | 003 | 9 | 1 | 20 |
| **M4** — It Writes to Repos | 004 | 7 | 1 | 27 |
| **M5** — It Analyzes Code | 005 | 10 | 1 | 37 |
| **M6** — Full Feature Set | 006+007+008 | 17 | 3 | 54 |
| **M7** — Ship It | 009 | 10 | 1 | 64 |

---

## Accelerated Schedule (Pulling Work Forward)

The linear milestone sequence above is the safest path. Here's how to accelerate by overlapping work:

### Overlap Opportunity 1: Start EPIC-007 early
EPIC-007 (vdoc) only depends on EPIC-002 (repos connected). It can start during Milestone 3-4 instead of waiting for Milestone 6.

```
M1 ──→ M2 ──→ M3 ──→ M4 ──→ M5 ──→ M6(006+008) ──→ M7
              │
              └── EPIC-007 (4 stories) ────┘  ← pulled forward
```

### Overlap Opportunity 2: Frontend components early
STORY-003-07 (Markdown Editor), STORY-006-07 (DiffViewer), STORY-008-04 (TrendChart) are pure UI components with no backend dependencies. They can be built any time after M1 and reused when their pages are ready.

### Overlap Opportunity 3: Template creation during M1
STORY-003-02 (Skill Templates) and STORY-003-03 (Rule & Command Templates) are just markdown files. They can be written during M1 while the foundation is being built.

### Accelerated Timeline

```
Week 1-2:   M1 (Foundation) + STORY-003-02, 003-03 (templates)
Week 3-4:   M2 (Wizard/Repos) + STORY-003-01, 003-07 (template loader + editor component)
Week 5-6:   M3 (Skills/Rules APIs + pages) + EPIC-007 (vdoc, 4 stories)
Week 7:     M4 (Injection)
Week 8-9:   M5 (Analyzer — 6 analyzers in parallel)
Week 10-11: M6 (PR Nav + Trends — 2 parallel tracks, vdoc already done)
Week 12:    M7 (Polish + Publish)
```

---

## Risk Checkpoints

| After Milestone | Check | Action if Failed |
|-----------------|-------|------------------|
| M1 | `npm run dev` starts cleanly | Fix build config before proceeding |
| M2 | Wizard completes, repos scanned | Validate git scanner on 3+ real repos |
| M3 | Edit + save skills roundtrip works | Verify CodeMirror doesn't bloat bundle |
| M4 | Injected files readable by Claude Code | Test with real Claude Code session |
| M5 | Analysis completes in < 30s on medium repo | Profile and optimize slow checks |
| M6 | All 3 tracks integrate cleanly | Integration test on dashboard |
| M7 | `npm install -g` works on fresh machine | Test on macOS + Linux + Windows |

---

## Quick Reference: All 64 Stories

### EPIC-001: Project Foundation
| ID | Title | Complexity |
|----|-------|------------|
| STORY-001-01 | Project Config & Directory Structure | Medium |
| STORY-001-02 | Vite + React + Tailwind App Shell | High |
| STORY-001-03 | Fastify Server with Health Check | Low |
| STORY-001-04 | SQLite Database Schema & Query Layer | Medium |
| STORY-001-05 | CLI Entry Point | Low |

### EPIC-002: Setup Wizard & Repo Management
| ID | Title | Complexity |
|----|-------|------------|
| STORY-002-01 | Git Scanner | Medium |
| STORY-002-02 | Platform Detection | Low |
| STORY-002-03 | Repo CRUD API | Medium |
| STORY-002-04 | Config API | Low |
| STORY-002-05 | Setup Wizard UI | High |
| STORY-002-06 | Dashboard Home with Repo Cards | Medium |

### EPIC-003: Skills & Rules Editor
| ID | Title | Complexity |
|----|-------|------------|
| STORY-003-01 | Template System | Low |
| STORY-003-02 | Skill Templates (10 files) | High |
| STORY-003-03 | Rule & Command Templates | High |
| STORY-003-04 | Skills CRUD API | Medium |
| STORY-003-05 | Rules CRUD API | Medium |
| STORY-003-06 | Commands CRUD API | Medium |
| STORY-003-07 | Markdown Editor Component | Medium |
| STORY-003-08 | Skills Editor Page | Medium |
| STORY-003-09 | Rules Editor Page | High |

### EPIC-004: File Injection System
| ID | Title | Complexity |
|----|-------|------------|
| STORY-004-01 | Injector Orchestrator | Medium |
| STORY-004-02 | Claude Code Injector | Medium |
| STORY-004-03 | Cursor Injector | Medium |
| STORY-004-04 | Windsurf & Generic Injectors | Medium |
| STORY-004-05 | Gitignore Updater | Low |
| STORY-004-06 | Inject & Preview API | Medium |
| STORY-004-07 | Inject UI (Button, Preview, Status) | Medium |

### EPIC-005: Analyzer Engine
| ID | Title | Complexity |
|----|-------|------------|
| STORY-005-01 | Language Detector | Low |
| STORY-005-02 | File & Function Size Checker | Medium |
| STORY-005-03 | Error Handling Pattern Detector | Medium |
| STORY-005-04 | Complexity Analysis (Lizard) | Medium |
| STORY-005-05 | Duplication Detection (jscpd) | Medium |
| STORY-005-06 | Dependency Detection | Medium |
| STORY-005-07 | Coupling Analysis | Low |
| STORY-005-08 | Analysis Engine & Report Writer | High |
| STORY-005-09 | Analysis API | Medium |
| STORY-005-10 | Analysis View UI | High |

### EPIC-006: PR & Branch Navigation
| ID | Title | Complexity |
|----|-------|------------|
| STORY-006-01 | Git Diff Parser | Low |
| STORY-006-02 | Git History Utilities | Low |
| STORY-006-03 | Branch Listing API | Medium |
| STORY-006-04 | Per-Branch Analysis API | Medium |
| STORY-006-05 | Review File Reader | Low |
| STORY-006-06 | PR Navigator Page | High |
| STORY-006-07 | DiffViewer Component | Medium |

### EPIC-007: vdoc Integration
| ID | Title | Complexity |
|----|-------|------------|
| STORY-007-01 | vdoc Manifest Parser | Low |
| STORY-007-02 | Freshness Monitor | Low |
| STORY-007-03 | Docs Status API | Low |
| STORY-007-04 | Docs Status Page | Medium |

### EPIC-008: Trends & Historical Metrics
| ID | Title | Complexity |
|----|-------|------------|
| STORY-008-01 | Metric Snapshot System | Low |
| STORY-008-02 | Trend Computation | Medium |
| STORY-008-03 | Trends API | Medium |
| STORY-008-04 | TrendChart Component | Medium |
| STORY-008-05 | Trends Page | High |
| STORY-008-06 | Dashboard Trend Indicators | Low |

### EPIC-009: Polish & Distribution
| ID | Title | Complexity |
|----|-------|------------|
| STORY-009-01 | Error Handling Audit | High |
| STORY-009-02 | Performance Optimization | High |
| STORY-009-03 | Full Codebase Scan Mode | Medium |
| STORY-009-04 | Export Analysis Reports | Medium |
| STORY-009-05 | Pre-Commit Hook Installer | Medium |
| STORY-009-06 | Settings Page | High |
| STORY-009-07 | npm Publish Setup | Medium |
| STORY-009-08 | Cross-Platform Compatibility | High |
| STORY-009-09 | Version Check & Update Notification | High |
| STORY-009-10 | Changelog System | Medium |
