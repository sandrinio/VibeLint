# EPIC-002: Setup Wizard & Repo Management

## Metadata
| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Ambiguity** | Low |
| **Context Source** | [PRD v4](../PRD.md) — Sprint 1: Foundation |
| **Owner** | Engineering |
| **Priority** | P0 - Critical |
| **Tags** | #wizard, #onboarding, #repos, #git, #dashboard |
| **Target Date** | TBD |

---

## 1. Problem & Value
> Target Audience: Stakeholders, Business Sponsors

### 1.1 The Problem
First-time users need a guided onboarding experience. They must select their AI coding platform, connect repositories, and optionally configure an API key. Without this, VibeLint has no repos to work with and no platform context to generate the right files.

### 1.2 The Solution
A 3-panel setup wizard (Platform Picker, Repo Adder, API Key), backed by REST APIs for repo CRUD and a git scanner that auto-detects languages, branches, and existing config files. After the wizard, the dashboard home page shows connected repos as health cards.

### 1.3 Success Metrics (North Star)
- First-launch shows the setup wizard automatically
- Platform auto-detection correctly identifies installed AI coding tools
- Repos can be added/removed and are scanned for languages and branches
- Dashboard home shows repo cards with accurate metadata
- Wizard state persists across server restarts

---

## 2. Scope Boundaries
> Target Audience: AI Agents (Critical for preventing hallucinations)

### IN-SCOPE (Build This)
- [ ] REST API: repo CRUD — add, remove, list repos (`src/server/api/repos.ts`)
- [ ] REST API: config — save/load settings (`src/server/api/config.ts`)
- [ ] Git scanner: detect languages from file extensions (`src/server/git/scanner.ts`)
- [ ] Git scanner: list branches, detect current branch
- [ ] Git scanner: check for existing config files (CLAUDE.md, .cursorrules, .vibelint/, vdocs/)
- [ ] Platform detection: check if Claude Code, Cursor, Windsurf, Gemini CLI are installed
- [ ] Frontend: Setup wizard — Panel 1: Platform Picker with auto-detection
- [ ] Frontend: Setup wizard — Panel 2: Repo Adder with scan results
- [ ] Frontend: Setup wizard — Panel 3: API Key (optional)
- [ ] Frontend: Dashboard home page with repo health cards
- [ ] Persist wizard completion state in config table

### OUT-OF-SCOPE (Do NOT Build This)
- Skills/rules editing (EPIC-003)
- File injection (EPIC-004)
- Analysis results on repo cards (EPIC-005)
- vdoc status on repo cards (EPIC-007)
- Trend charts (EPIC-008)

---

## 3. Context

### 3.1 User Personas
- **New User**: First launch, needs guided onboarding with auto-detection
- **Returning User**: Skips wizard, sees dashboard home with connected repos
- **Multi-repo User**: Connects multiple repos, each scanned independently

### 3.2 Constraints
| Type | Constraint |
|------|------------|
| **UX** | Wizard must be completable in under 2 minutes |
| **Detection** | Platform detection uses `which`/`where` commands — best effort |
| **Git** | Repo path must contain a `.git` directory to be valid |
| **Behavioral** | Wizard only shows on first launch (config flag) |

---

## 4. Technical Context
> Target Audience: AI Agents — READ THIS before decomposing.

### 4.1 Affected Areas
| Area | Files/Modules | Change Type |
|------|---------------|-------------|
| Repo API | `src/server/api/repos.ts` | Create |
| Config API | `src/server/api/config.ts` | Create |
| Git scanner | `src/server/git/scanner.ts` | Create |
| Wizard UI | `src/client/pages/SetupWizard.tsx` | Create |
| Dashboard | `src/client/pages/Dashboard.tsx` | Create |
| API client | `src/client/lib/api.ts` | Create |
| Components | `src/client/components/RepoCard.tsx`, `PlatformPicker.tsx` | Create |

### 4.2 Dependencies
| Type | Dependency | Status |
|------|------------|--------|
| **Requires** | EPIC-001 (Project Foundation) | Must be complete |
| **Unlocks** | EPIC-003 (Skills & Rules Editor) | Waiting |
| **Unlocks** | EPIC-004 (File Injection System) | Waiting |

### 4.3 Integration Points
| System | Purpose | Notes |
|--------|---------|-------|
| Local filesystem | Repo path validation | Check `.git` exists |
| `git` CLI | Branch listing, file detection | Shell exec via `child_process` |
| System PATH | Platform detection | `which claude`, `which cursor`, etc. |
| SQLite `repos` table | Persist connected repos | CRUD operations |
| SQLite `config` table | Persist wizard state, settings | Key-value store |

---

## 5. Decomposition Guidance
> Hints for AI story breakdown. Check all that apply.

- [ ] **Schema/Migration** - Uses existing schema from EPIC-001
- [x] **API Work** - Repo CRUD + Config endpoints
- [x] **UI Work** - Wizard (3 panels) + Dashboard home
- [ ] **Integration** - Git CLI, filesystem, PATH detection
- [ ] **Bug Fixes** - Greenfield
- [ ] **Hygiene** - N/A
- [ ] **Testing** - Git scanner unit tests

### Suggested Story Sequence
1. **STORY-002-01**: Git scanner — language detection, branch listing, config file check
2. **STORY-002-02**: Platform detection — detect installed AI coding tools
3. **STORY-002-03**: REST API — repo CRUD (add/remove/list with scanning)
4. **STORY-002-04**: REST API — config save/load (settings + wizard state)
5. **STORY-002-05**: Frontend — Setup Wizard (3-panel flow)
6. **STORY-002-06**: Frontend — Dashboard home with repo cards

---

## 6. Risks & Edge Cases
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Repo path doesn't contain `.git` | Medium | Validate on add, show clear error |
| Platform detection false negative (custom install paths) | Medium | Allow manual platform selection |
| User adds repo then deletes it from disk | Low | Handle gracefully on next scan, show warning |
| Very large repo slows down language scanning | Low | Limit file scanning depth, sample first 1000 files |
| Windows path separators | Medium | Use `path.resolve()` consistently |

---

## 7. Acceptance Criteria (Epic-Level)
> How do we know the EPIC is complete? Full user flow.

```gherkin
Feature: Setup Wizard & Repo Management

  Scenario: First-launch wizard
    Given the user launches VibeLint for the first time
    When the dashboard loads
    Then the setup wizard is displayed
    And Panel 1 shows detected AI coding platforms

  Scenario: Platform detection
    Given Claude Code is installed on the machine
    When Panel 1 loads
    Then "Claude Code" shows a "Detected" indicator

  Scenario: Add a repository
    Given the user is on Panel 2 of the wizard
    When they paste a valid repo path
    Then the repo is scanned for languages, branches, and existing files
    And the scan results are displayed

  Scenario: Complete wizard
    Given the user has selected a platform and added a repo
    When they click "Finish" on Panel 3
    Then the wizard closes
    And the Dashboard home loads with the repo card

  Scenario: Return visit skips wizard
    Given the user has completed the wizard previously
    When they launch VibeLint again
    Then the Dashboard home loads directly (no wizard)

  Scenario: Remove a repository
    Given a repo is connected
    When the user removes it from the dashboard
    Then the repo is deleted from the database
    And its card disappears from the dashboard
```

---

## 8. Open Questions
| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| How to detect Cursor installation? | A: Check `which cursor`, B: Check `~/.cursor/` dir | Platform detection accuracy | Eng | Open |
| Should wizard allow multi-platform selection? | A: Single platform, B: Multiple (per-repo) | UI complexity | Eng | Leaning B |
| Browse button for repo path — native dialog? | A: Native file dialog (Electron-like), B: Text input only | UX quality | Eng | Leaning B (web-only) |

---

## 9. Artifact Links
> Auto-populated as Epic is decomposed.

**Stories:**
- [ ] STORY-002-01: Git Scanner
- [ ] STORY-002-02: Platform Detection
- [ ] STORY-002-03: Repo CRUD API
- [ ] STORY-002-04: Config API
- [ ] STORY-002-05: Setup Wizard UI
- [ ] STORY-002-06: Dashboard Home

**References:**
- PRD: [PRD.md](../PRD.md)
- PRD User Flow (Wizard): PRD.md lines 27-107
- PRD Dashboard Home: PRD.md lines 286-294
- PRD Sprint 1: PRD.md lines 783-796
