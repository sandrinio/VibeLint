# EPIC-004: File Injection System

## Metadata
| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Ambiguity** | Low |
| **Context Source** | [PRD v4](../PRD.md) — Sprint 2: Skills & Rules Editor |
| **Owner** | Engineering |
| **Priority** | P1 - High |
| **Tags** | #injection, #platforms, #gitignore, #claude-code, #cursor, #windsurf |
| **Target Date** | TBD |

---

## 1. Problem & Value
> Target Audience: Stakeholders, Business Sponsors

### 1.1 The Problem
Users have authored and customized their skills, rules, and commands in the dashboard, but those files only exist in VibeLint's internal storage. The AI coding agent needs these files to be physically present in the repo filesystem. Without injection, the entire editing workflow has no effect.

### 1.2 The Solution
A file injection system that takes the prepared content and writes platform-specific files into the target repo. Each platform (Claude Code, Cursor, Windsurf, Generic) has different file structures and conventions. The injector handles all platform-specific transformations, updates `.gitignore` to keep injected files local-only, and provides a preview of what will be written before executing.

### 1.3 Success Metrics (North Star)
- "Inject into [repo]" writes all correct files for the selected platform
- Claude Code repos get `CLAUDE.md`, `.claude/commands/*.md`, `.vibelint/`
- Cursor repos get `.cursorrules`, `.cursor/rules/vibelint.mdc`, `.vibelint/`
- `.gitignore` is updated to exclude injected directories
- Re-injection updates files without duplicating content

---

## 2. Scope Boundaries
> Target Audience: AI Agents (Critical for preventing hallucinations)

### IN-SCOPE (Build This)
- [ ] Injector orchestrator (`src/server/injector/index.ts`) — coordinates platform-specific injection
- [ ] Claude Code injector (`src/server/injector/platforms/claude-code.ts`) — CLAUDE.md, .claude/commands/, .vibelint/
- [ ] Cursor injector (`src/server/injector/platforms/cursor.ts`) — .cursorrules, .cursor/rules/
- [ ] Windsurf injector (`src/server/injector/platforms/windsurf.ts`) — .windsurfrules, .windsurf/rules/
- [ ] Generic injector (`src/server/injector/platforms/generic.ts`) — AGENTS.md, .vibelint/prompts/
- [ ] Gitignore updater — add platform-specific entries to `.gitignore`
- [ ] REST API: inject endpoint (`src/server/api/inject.ts`) — trigger injection for a repo
- [ ] REST API: injection preview — show what files will be written/modified
- [ ] Frontend: "Inject" button with file preview modal
- [ ] Frontend: injection status feedback (success/error)
- [ ] Update `repos.injected_at` timestamp after successful injection

### OUT-OF-SCOPE (Do NOT Build This)
- Editing skills/rules content (EPIC-003)
- Analysis reports in `.vibelint/reports/` (EPIC-005)
- vdoc files in `vdocs/` (EPIC-007)

---

## 3. Context

### 3.1 User Personas
- **Claude Code User**: Expects CLAUDE.md at repo root, commands in `.claude/commands/`
- **Cursor User**: Expects `.cursorrules` at repo root, rules in `.cursor/rules/`
- **Multi-platform User**: Different repos use different platforms

### 3.2 Constraints
| Type | Constraint |
|------|------------|
| **Filesystem** | Must write files to arbitrary repo paths on disk |
| **Permissions** | Needs write access to repo directories |
| **Idempotent** | Re-injection must safely overwrite without duplication |
| **Gitignore** | Injected files should be `.gitignored` (local-only per developer) |
| **Non-destructive** | Must not delete or modify existing non-VibeLint files |

---

## 4. Technical Context
> Target Audience: AI Agents — READ THIS before decomposing.

### 4.1 Affected Areas
| Area | Files/Modules | Change Type |
|------|---------------|-------------|
| Injector orchestrator | `src/server/injector/index.ts` | Create |
| Claude Code platform | `src/server/injector/platforms/claude-code.ts` | Create |
| Cursor platform | `src/server/injector/platforms/cursor.ts` | Create |
| Windsurf platform | `src/server/injector/platforms/windsurf.ts` | Create |
| Generic platform | `src/server/injector/platforms/generic.ts` | Create |
| Inject API | `src/server/api/inject.ts` | Create |
| Dashboard UI | `src/client/pages/Dashboard.tsx` | Modify (add inject button) |
| API client | `src/client/lib/api.ts` | Modify (add inject endpoint) |

### 4.2 Dependencies
| Type | Dependency | Status |
|------|------------|--------|
| **Requires** | EPIC-001 (Project Foundation) | Must be complete |
| **Requires** | EPIC-002 (Repos connected, platform selected) | Must be complete |
| **Requires** | EPIC-003 (Skills & rules content authored) | Must be complete |
| **Unlocks** | EPIC-005 (Analyzer writes to .vibelint/reports/) | Waiting |

### 4.3 Integration Points
| System | Purpose | Notes |
|--------|---------|-------|
| Local filesystem | Write files to repos | `fs.writeFile`, `fs.mkdir` |
| `.gitignore` | Append VibeLint entries | Parse and append, avoid duplicates |
| SQLite `repos` table | Read repo path/platform, update `injected_at` | Query + update |
| Skills/Rules/Commands APIs | Read prepared content | From EPIC-003 |

---

## 5. Decomposition Guidance
> Hints for AI story breakdown. Check all that apply.

- [ ] **Schema/Migration** - No schema changes
- [x] **API Work** - Inject + preview endpoints
- [x] **UI Work** - Inject button, preview modal, status feedback
- [x] **Integration** - Filesystem writes, gitignore updates
- [ ] **Bug Fixes** - Greenfield
- [ ] **Hygiene** - N/A
- [x] **Testing** - Injection to temp directories, gitignore parsing

### Suggested Story Sequence
1. **STORY-004-01**: Injector orchestrator — platform routing and shared injection logic
2. **STORY-004-02**: Claude Code injector — CLAUDE.md, .claude/commands/, .vibelint/skills/
3. **STORY-004-03**: Cursor injector — .cursorrules, .cursor/rules/vibelint.mdc
4. **STORY-004-04**: Windsurf + Generic injectors
5. **STORY-004-05**: Gitignore updater — append entries, avoid duplicates
6. **STORY-004-06**: REST API — inject + preview endpoints
7. **STORY-004-07**: Frontend — Inject button, preview modal, status feedback

---

## 6. Risks & Edge Cases
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Repo directory doesn't exist or moved | Medium | Validate path before injection, clear error |
| No write permission to repo directory | Low | Check permissions first, report error |
| Existing CLAUDE.md has user's custom content | High | Warn before overwriting, offer merge option |
| `.gitignore` already has entries (partial injection) | Medium | Parse gitignore, only add missing entries |
| Concurrent injection to same repo | Low | Use simple file lock or queue |

---

## 7. Acceptance Criteria (Epic-Level)
> How do we know the EPIC is complete? Full user flow.

```gherkin
Feature: File Injection System

  Scenario: Inject into Claude Code repo
    Given a repo is connected with platform "Claude Code"
    And skills and rules have been authored
    When the user clicks "Inject into [repo]"
    Then CLAUDE.md is written to the repo root
    And .claude/commands/ contains review.md, check.md, health.md
    And .vibelint/skills/ contains the authored skill files
    And .vibelint/config.yml is written
    And LESSONS.md is written to the repo root

  Scenario: Inject into Cursor repo
    Given a repo is connected with platform "Cursor"
    When the user clicks "Inject into [repo]"
    Then .cursorrules is written to the repo root
    And .cursor/rules/vibelint.mdc is written

  Scenario: Gitignore updated
    Given a repo with an existing .gitignore
    When injection completes
    Then .gitignore contains entries for .vibelint/ and platform-specific dirs
    And no duplicate entries exist

  Scenario: Injection preview
    Given skills and rules are ready for injection
    When the user clicks the inject button
    Then a preview modal shows all files that will be written
    And the user can confirm or cancel

  Scenario: Re-injection overwrites cleanly
    Given files were previously injected
    When the user modifies a skill and re-injects
    Then the updated file replaces the old version
    And no orphan files remain
```

---

## 8. Open Questions
| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| What happens to existing CLAUDE.md? | A: Overwrite with warning, B: Merge/append, C: Backup then overwrite | User data safety | Eng | Leaning C |
| Should injection be atomic (all-or-nothing)? | A: Yes (rollback on failure), B: Best-effort (write what we can) | Reliability | Eng | Leaning A |
| Include `.vibelint/reports/` dir on injection? | A: Yes (empty dir placeholder), B: No (created by analyzer) | Analyzer expects dir | Eng | Leaning A |

---

## 9. Artifact Links
> Auto-populated as Epic is decomposed.

**Stories:**
- [ ] STORY-004-01: Injector Orchestrator
- [ ] STORY-004-02: Claude Code Injector
- [ ] STORY-004-03: Cursor Injector
- [ ] STORY-004-04: Windsurf & Generic Injectors
- [ ] STORY-004-05: Gitignore Updater
- [ ] STORY-004-06: Inject & Preview API
- [ ] STORY-004-07: Inject UI (Button, Preview, Status)

**References:**
- PRD: [PRD.md](../PRD.md)
- PRD Injection Step: PRD.md lines 166-197
- PRD Per-Platform File Structure: PRD.md lines 429-515
- PRD Sprint 2: PRD.md lines 798-812
