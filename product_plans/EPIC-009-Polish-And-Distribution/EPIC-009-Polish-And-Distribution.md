# EPIC-009: Polish & Distribution

## Metadata
| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Ambiguity** | Medium |
| **Context Source** | [PRD v4](../PRD.md) — Sprint 5: Trends + Polish |
| **Owner** | Engineering |
| **Priority** | P3 - Low |
| **Tags** | #polish, #npm, #distribution, #performance, #hooks, #export |
| **Target Date** | TBD |

---

## 1. Problem & Value
> Target Audience: Stakeholders, Business Sponsors

### 1.1 The Problem
The core features work but the product isn't ready for public distribution. Error handling is incomplete, large repos may hit performance issues, there's no npm publish pipeline, and optional quality-of-life features (pre-commit hooks, export, full codebase scan) are missing. Without polish, the install-and-run experience will be rough.

### 1.2 The Solution
A polish sprint covering: robust error handling across all paths, performance optimization for large repos, an npm publish pipeline, optional pre-commit hook installer, full codebase scan mode, and analysis report export. This epic takes the product from "works in development" to "works in production."

### 1.3 Success Metrics (North Star)
- `npm install -g vibelint && vibelint` works on macOS, Linux, and Windows
- No unhandled errors in common workflows
- Repos with 50K+ files can be analyzed without timeouts
- Analysis reports can be exported as markdown or JSON
- Optional pre-commit hook runs analysis on commit

---

## 2. Scope Boundaries
> Target Audience: AI Agents (Critical for preventing hallucinations)

### IN-SCOPE (Build This)
- [ ] Error handling audit — add error boundaries, try/catch, user-facing error messages
- [ ] Performance optimization — file scanning limits, lazy loading, pagination
- [ ] Full codebase scan mode (analyze entire repo, not just branch diff)
- [ ] Export analysis reports as markdown and JSON
- [ ] Pre-commit hook installer (optional) — run analysis before commit
- [ ] npm publish setup — package.json metadata, bin entry, prepublish scripts
- [ ] Frontend: Settings page (`src/client/pages/Settings.tsx`)
- [ ] Frontend: error boundary component
- [ ] Cross-platform testing (macOS, Linux, Windows path handling)
- [ ] Version check & update notification — detect new npm versions, notify users, self-update
- [ ] Changelog system — maintain CHANGELOG.md, serve via API, render in UI

### OUT-OF-SCOPE (Do NOT Build This)
- New features beyond what's defined in previous epics
- CI/CD pipeline for VibeLint's own development
- Plugin/extension system
- Cloud/hosted version

---

## 3. Context

### 3.1 User Personas
- **New User**: Expects `npm install -g vibelint` to just work, no debugging required
- **Power User**: Wants pre-commit hooks, export capabilities, settings control
- **Large Repo User**: Needs VibeLint to handle large codebases without freezing

### 3.2 Constraints
| Type | Constraint |
|------|------------|
| **Platforms** | macOS, Linux, Windows |
| **npm** | Must publish as a single global package |
| **Performance** | No operation should take > 60 seconds without progress indication |
| **Backward compat** | All existing features must continue working |

---

## 4. Technical Context
> Target Audience: AI Agents — READ THIS before decomposing.

### 4.1 Affected Areas
| Area | Files/Modules | Change Type |
|------|---------------|-------------|
| Error handling | All `src/server/api/*.ts` routes | Modify |
| Performance | `src/server/analyzer/engine.ts`, `src/server/git/scanner.ts` | Modify |
| Export | `src/server/api/analysis.ts` (extend) | Modify |
| Pre-commit hook | New file: `src/server/hooks/precommit.ts` | Create |
| Settings UI | `src/client/pages/Settings.tsx` | Create |
| Package config | `package.json` | Modify |
| Error boundary | `src/client/components/ErrorBoundary.tsx` | Create |
| Version check | `src/server/version/checker.ts`, `src/server/api/version.ts` | Create |
| Update banner | `src/client/components/UpdateBanner.tsx` | Create |
| Changelog | `CHANGELOG.md`, `src/server/api/changelog.ts`, `src/client/pages/Changelog.tsx` | Create |

### 4.2 Dependencies
| Type | Dependency | Status |
|------|------------|--------|
| **Requires** | EPIC-001 through EPIC-008 (all features complete) | Must be complete |
| **External** | npm registry account | Setup needed |
| **External** | `semver` npm package | Install at epic start |

### 4.3 Integration Points
| System | Purpose | Notes |
|--------|---------|-------|
| npm registry | Package distribution | `npm publish` |
| npm registry | Version check | `GET registry.npmjs.org/vibelint/latest` |
| Git hooks | Pre-commit integration | `.git/hooks/pre-commit` |
| Cross-platform | Path handling, child_process | Windows compatibility |

---

## 5. Decomposition Guidance
> Hints for AI story breakdown. Check all that apply.

- [ ] **Schema/Migration** - No schema changes
- [x] **API Work** - Export endpoints, settings API updates
- [x] **UI Work** - Settings page, error boundaries
- [ ] **Integration** - Git hooks, npm publish
- [x] **Bug Fixes** - Error handling improvements
- [x] **Hygiene** - Cross-platform compat, performance
- [x] **Testing** - End-to-end testing, cross-platform

### Suggested Story Sequence
1. **STORY-009-01**: Error handling audit — add error boundaries, API error responses
2. **STORY-009-02**: Performance optimization — file limits, lazy loading, timeouts
3. **STORY-009-03**: Full codebase scan mode (analyze without branch diff)
4. **STORY-009-04**: Export analysis reports (markdown + JSON download)
5. **STORY-009-05**: Pre-commit hook installer
6. **STORY-009-06**: Settings page (API keys, platforms, thresholds, hooks)
7. **STORY-009-07**: npm publish setup (package metadata, bin, prepublish)
8. **STORY-009-08**: Cross-platform compatibility (Windows path handling)
9. **STORY-009-09**: Version check & update notification (npm registry check, CLI/UI notification, self-update)
10. **STORY-009-10**: Changelog system (CHANGELOG.md, API endpoint, Changelog page)

---

## 6. Risks & Edge Cases
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `better-sqlite3` native module fails on some platforms | Medium | Document prerequisites, test on CI |
| Pre-commit hook conflicts with existing hooks | Medium | Append to existing hooks, don't overwrite |
| npm publish breaks if `bin` path is wrong | Low | Test with `npm pack` + `npm install -g` locally first |
| Windows path separators throughout codebase | Medium | Use `path.join`/`path.resolve` everywhere, test on Windows |
| Large repo analysis OOM | Low | Set file count limits, stream processing |
| npm registry unreachable during version check | Medium | 5s timeout, graceful fallback, never block startup |
| Self-update replaces running process | Low | Advise user to restart after update |

---

## 7. Acceptance Criteria (Epic-Level)
> How do we know the EPIC is complete? Full user flow.

```gherkin
Feature: Polish & Distribution

  Scenario: Clean npm install
    Given a user has Node.js >= 18
    When they run "npm install -g vibelint"
    Then the install succeeds on macOS, Linux, and Windows
    And "vibelint" command is available globally

  Scenario: Error handling
    Given an API endpoint receives invalid input
    When the request is processed
    Then a clear error message is returned (not a stack trace)
    And the server does not crash

  Scenario: Large repo performance
    Given a repo with 50,000+ files
    When the user runs analysis
    Then analysis completes within 60 seconds
    And progress is shown to the user

  Scenario: Export analysis
    Given an analysis has been run
    When the user clicks "Export as Markdown"
    Then a markdown file is downloaded
    And it matches the format of .vibelint/reports/latest.md

  Scenario: Pre-commit hook
    Given the user enables pre-commit hooks in Settings
    When they make a git commit
    Then VibeLint analysis runs before the commit completes
    And warnings are displayed if thresholds are exceeded

  Scenario: Settings page
    Given the user opens Settings
    Then they can modify API keys, platform selection, analysis thresholds
    And changes persist after saving

  Scenario: Update notification
    Given a newer version of vibelint exists on npm
    When the user opens VibeLint
    Then a notification banner shows the available update
    And the CLI prints the update info on startup

  Scenario: Self-update
    Given vibelint is installed globally via npm
    When the user runs "vibelint update"
    Then the latest version is installed
    And the new version number is displayed

  Scenario: Changelog
    Given the user navigates to /changelog
    Then they see a formatted list of changes per version
    And the current version is highlighted
```

---

## 8. Open Questions
| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| Pre-commit hook: block commit or just warn? | A: Block on FAIL, B: Warn only, C: Configurable | Developer workflow | Eng | Leaning C |
| npm scope? | A: `vibelint` (unscoped), B: `@vibelint/cli` (scoped) | Package naming | Eng | Leaning A |
| Include README in npm package? | A: Yes (standard), B: Minimal (link to docs site) | Package size | Eng | Leaning A |
| Windows CI testing? | A: GitHub Actions with Windows runner, B: Manual testing | Quality assurance | Eng | Leaning A |

---

## 9. Artifact Links
> Auto-populated as Epic is decomposed.

**Stories:**
- [ ] STORY-009-01: Error Handling Audit
- [ ] STORY-009-02: Performance Optimization
- [ ] STORY-009-03: Full Codebase Scan Mode
- [ ] STORY-009-04: Export Analysis Reports
- [ ] STORY-009-05: Pre-Commit Hook Installer
- [ ] STORY-009-06: Settings Page
- [ ] STORY-009-07: npm Publish Setup
- [ ] STORY-009-08: Cross-Platform Compatibility
- [ ] STORY-009-09: Version Check & Update Notification
- [ ] STORY-009-10: Changelog System

**References:**
- PRD: [PRD.md](../PRD.md)
- PRD Settings: PRD.md line 425
- PRD Sprint 5: PRD.md lines 848-864
