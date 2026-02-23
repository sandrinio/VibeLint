# EPIC-003: Skills & Rules Editor

## Metadata
| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Ambiguity** | Low |
| **Context Source** | [PRD v4](../PRD.md) — Sprint 2: Skills & Rules Editor |
| **Owner** | Engineering |
| **Priority** | P1 - High |
| **Tags** | #skills, #rules, #editor, #templates, #commands, #markdown |
| **Target Date** | TBD |

---

## 1. Problem & Value
> Target Audience: Stakeholders, Business Sponsors

### 1.1 The Problem
Users need to author, customize, and manage the context files that make their AI coding agent effective — skills (coding guidelines), platform rules (CLAUDE.md, .cursorrules), slash commands, and LESSONS.md. Without a visual editor, users must manually create and maintain these files, which is error-prone and tedious.

### 1.2 The Solution
A template system that provides sensible defaults for skills, rules, and slash commands. A full visual editor in the dashboard with markdown editing, preview, and per-repo customization. REST APIs for CRUD operations on all file types. This is the "authoring workbench" — users prepare everything here before injecting into repos.

### 1.3 Success Metrics (North Star)
- Default skill templates load correctly for detected languages
- Users can edit any skill, rule, or command in the browser markdown editor
- Custom skills/commands can be created from scratch
- Changes persist across server restarts
- Preview mode renders markdown accurately

---

## 2. Scope Boundaries
> Target Audience: AI Agents (Critical for preventing hallucinations)

### IN-SCOPE (Build This)
- [ ] Template system — load default skills/rules/commands from `templates/` directory
- [ ] REST API: skill CRUD — list, read, update, create custom (`src/server/api/skills.ts`)
- [ ] REST API: rules CRUD — CLAUDE.md, LESSONS.md, platform rules (`src/server/api/rules.ts`)
- [ ] REST API: slash command CRUD — list, read, update, create (`src/server/api/commands.ts`)
- [ ] Default skill templates: general, typescript, python, go, java, rust, csharp, ruby, error-handling, testing
- [ ] Default rule templates: CLAUDE.md, .cursorrules, .windsurfrules, AGENTS.md
- [ ] Default slash commands: review, check, health, vdoc-init, vdoc-update
- [ ] Default config template: config.yml, LESSONS.md
- [ ] Frontend: Skills Editor page with markdown editor + preview (`src/client/pages/SkillsEditor.tsx`)
- [ ] Frontend: Rules Editor page with CLAUDE.md + commands editing (`src/client/pages/RulesEditor.tsx`)
- [ ] Frontend: Markdown editor component (CodeMirror or Monaco wrapper)
- [ ] Frontend: File preview component (rendered markdown)

### OUT-OF-SCOPE (Do NOT Build This)
- File injection into repos (EPIC-004)
- Platform-specific file generation (EPIC-004)
- Analysis reports (EPIC-005)
- Any AI-powered features (out of scope for VibeLint itself)

---

## 3. Context

### 3.1 User Personas
- **New User**: Uses default templates, maybe tweaks a few rules
- **Power User**: Creates custom skills, edits CLAUDE.md extensively, adds project-specific commands
- **Multi-repo User**: Different skill sets per repo (TS project vs Python project)

### 3.2 Constraints
| Type | Constraint |
|------|------------|
| **Templates** | Stored in `templates/` directory, bundled with npm package |
| **Editor** | Must support markdown syntax highlighting and preview |
| **Storage** | Edited files stored per-repo in VibeLint's data layer |
| **Behavioral** | Editing does NOT write to repo — that's injection (EPIC-004) |

---

## 4. Technical Context
> Target Audience: AI Agents — READ THIS before decomposing.

### 4.1 Affected Areas
| Area | Files/Modules | Change Type |
|------|---------------|-------------|
| Skills API | `src/server/api/skills.ts` | Create |
| Rules API | `src/server/api/rules.ts` | Create |
| Commands API | `src/server/api/commands.ts` | Create |
| Skill templates | `templates/skills/*.md` | Create (10 files) |
| Rule templates | `templates/rules/**/*.template` | Create (4 files) |
| Command templates | `templates/commands/**/*.md` | Create (5+ files) |
| Config templates | `templates/config/*` | Create (2 files) |
| Skills Editor UI | `src/client/pages/SkillsEditor.tsx` | Create |
| Rules Editor UI | `src/client/pages/RulesEditor.tsx` | Create |
| Markdown Editor | `src/client/components/MarkdownEditor.tsx` | Create |
| File Preview | `src/client/components/FilePreview.tsx` | Create |
| API client | `src/client/lib/api.ts` | Modify (add endpoints) |

### 4.2 Dependencies
| Type | Dependency | Status |
|------|------------|--------|
| **Requires** | EPIC-001 (Project Foundation) | Must be complete |
| **Requires** | EPIC-002 (Repos connected, platform selected) | Must be complete |
| **Unlocks** | EPIC-004 (File Injection System) | Waiting |

### 4.3 Integration Points
| System | Purpose | Notes |
|--------|---------|-------|
| `templates/` directory | Default content source | Read-only, bundled |
| SQLite `config` table | Store per-repo customizations | JSON blobs |
| CodeMirror / Monaco | Markdown editing | npm dependency |
| `marked` or `markdown-it` | Markdown rendering | npm dependency for preview |

---

## 5. Decomposition Guidance
> Hints for AI story breakdown. Check all that apply.

- [ ] **Schema/Migration** - No schema changes
- [x] **API Work** - Skills, Rules, Commands CRUD (3 endpoints)
- [x] **UI Work** - Skills Editor, Rules Editor, Markdown Editor component
- [ ] **Integration** - Template loading from filesystem
- [ ] **Bug Fixes** - Greenfield
- [ ] **Hygiene** - N/A
- [x] **Testing** - Template loading, CRUD operations

### Suggested Story Sequence
1. **STORY-003-01**: Template system — load defaults from `templates/` directory
2. **STORY-003-02**: Skill templates — create all 10 default skill markdown files
3. **STORY-003-03**: Rule + command templates — CLAUDE.md, slash commands, config, LESSONS.md
4. **STORY-003-04**: REST API — skill CRUD
5. **STORY-003-05**: REST API — rules CRUD (platform rules + LESSONS.md)
6. **STORY-003-06**: REST API — slash command CRUD
7. **STORY-003-07**: Frontend — Markdown Editor component (CodeMirror/Monaco)
8. **STORY-003-08**: Frontend — Skills Editor page
9. **STORY-003-09**: Frontend — Rules Editor page (rules + commands + LESSONS.md)

---

## 6. Risks & Edge Cases
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CodeMirror bundle size too large | Medium | Use lazy loading, only load editor on demand |
| User edits overwrite default templates | Low | Defaults are read-only; edits stored separately |
| Markdown preview XSS via user content | Medium | Sanitize rendered HTML with DOMPurify |
| Large skill files slow editor | Low | Skill files are typically < 200 lines |

---

## 7. Acceptance Criteria (Epic-Level)
> How do we know the EPIC is complete? Full user flow.

```gherkin
Feature: Skills & Rules Editor

  Scenario: View default skills for a repo
    Given a TypeScript repo is connected
    When the user opens the Skills Editor
    Then they see general.md, typescript.md, error-handling.md, testing.md listed
    And each can be opened in the editor

  Scenario: Edit a skill
    Given the user opens typescript.md in the editor
    When they modify the content and click Save
    Then the changes are persisted
    And reloading the page shows the updated content

  Scenario: Create a custom skill
    Given the user clicks "+ Create New Skill"
    When they enter a name and content
    Then the custom skill appears in the skills list

  Scenario: Edit CLAUDE.md rules
    Given the user opens the Rules Editor
    When they modify CLAUDE.md content
    Then the changes are saved
    And the preview shows rendered markdown

  Scenario: Edit a slash command
    Given the user is on the Rules Editor page
    When they click Edit on the /review command
    Then the command markdown opens in the editor
    And changes can be saved

  Scenario: Reset to default
    Given a skill has been modified
    When the user clicks "Reset to Default"
    Then the content reverts to the original template
```

---

## 8. Open Questions
| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| CodeMirror 6 or Monaco Editor? | A: CodeMirror 6 (lighter, markdown-focused), B: Monaco (VS Code engine, heavier) | Bundle size, UX | Eng | Leaning A |
| Where to store per-repo skill edits? | A: SQLite (JSON blob), B: Filesystem (`~/.vibelint/repos/{id}/skills/`) | Persistence model | Eng | Leaning A |
| Should skills be per-repo or global? | A: Per-repo (different projects, different skills), B: Global + per-repo overrides | Data model | Eng | Leaning B |

---

## 9. Artifact Links
> Auto-populated as Epic is decomposed.

**Stories:**
- [ ] STORY-003-01: Template System
- [ ] STORY-003-02: Skill Templates
- [ ] STORY-003-03: Rule & Command Templates
- [ ] STORY-003-04: Skills CRUD API
- [ ] STORY-003-05: Rules CRUD API
- [ ] STORY-003-06: Commands CRUD API
- [ ] STORY-003-07: Markdown Editor Component
- [ ] STORY-003-08: Skills Editor Page
- [ ] STORY-003-09: Rules Editor Page

**References:**
- PRD: [PRD.md](../PRD.md)
- PRD Skills Editor: PRD.md lines 298-329
- PRD Rules Editor: PRD.md lines 331-367
- PRD Sprint 2: PRD.md lines 798-812
- PRD Injection File Structure: PRD.md lines 429-515
