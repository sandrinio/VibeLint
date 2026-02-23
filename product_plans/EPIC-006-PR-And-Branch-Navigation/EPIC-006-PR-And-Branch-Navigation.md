# EPIC-006: PR & Branch Navigation

## Metadata
| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Ambiguity** | Medium |
| **Context Source** | [PRD v4](../PRD.md) — Sprint 4: PR Navigation + vdoc |
| **Owner** | Engineering |
| **Priority** | P2 - Medium |
| **Tags** | #git, #branches, #pr, #diff, #review, #navigation |
| **Target Date** | TBD |

---

## 1. Problem & Value
> Target Audience: Stakeholders, Business Sponsors

### 1.1 The Problem
Developers working across multiple branches need to see code quality per branch, not just for the current working tree. They want to compare branches against main, view diff stats, and see analysis results alongside AI-generated reviews. Without branch navigation, VibeLint only shows a single snapshot of the repo.

### 1.2 The Solution
A PR/Branch Navigator page that lists all branches with diff stats vs main, allows drilling into any branch for full analysis, and displays AI agent-written reviews from `.vibelint/reviews/`. This includes a git diff parser, per-branch analysis capability, and a diff viewer component.

### 1.3 Success Metrics (North Star)
- Branch list shows all local branches with diff stats (files changed, +/-)
- Clicking a branch shows full analysis results for that branch vs main
- AI-written reviews (if present in `.vibelint/reviews/`) are displayed
- Diff viewer shows file-level changes with inline annotations

---

## 2. Scope Boundaries
> Target Audience: AI Agents (Critical for preventing hallucinations)

### IN-SCOPE (Build This)
- [ ] Git diff parser — branch comparison stats (`src/server/git/diff.ts`)
- [ ] Git history utilities (`src/server/git/history.ts`)
- [ ] Branch/PR listing from local git (branch name, ahead/behind, last commit)
- [ ] Per-branch analysis — run analyzer on any branch vs base branch
- [ ] REST API: branches endpoint — list branches with diff stats
- [ ] REST API: branch analysis — trigger/view analysis for a specific branch
- [ ] Review file watcher — detect `.vibelint/reviews/*.md` files
- [ ] Frontend: PR Navigator page (`src/client/pages/PRNavigator.tsx`)
- [ ] Frontend: DiffViewer component (`src/client/components/DiffViewer.tsx`)
- [ ] Frontend: branch list → diff view → analysis drill-down

### OUT-OF-SCOPE (Do NOT Build This)
- GitHub/GitLab API integration (local git only)
- Creating or merging branches/PRs
- Trend charts (EPIC-008)
- Triggering AI reviews (done by the coding agent, not VibeLint)

---

## 3. Context

### 3.1 User Personas
- **Developer**: Wants to see analysis for their feature branch before opening a PR
- **Reviewer**: Wants to see analysis + AI review for a branch they're reviewing
- **Tech Lead**: Wants to compare branch quality across the team

### 3.2 Constraints
| Type | Constraint |
|------|------------|
| **Git** | Local git only — no GitHub/GitLab API calls |
| **Performance** | Branch listing should be instant; per-branch analysis may take time |
| **Reviews** | VibeLint reads reviews, doesn't write them (agent writes them) |

---

## 4. Technical Context
> Target Audience: AI Agents — READ THIS before decomposing.

### 4.1 Affected Areas
| Area | Files/Modules | Change Type |
|------|---------------|-------------|
| Git diff | `src/server/git/diff.ts` | Create |
| Git history | `src/server/git/history.ts` | Create |
| Branches API | `src/server/api/branches.ts` (new) or extend `repos.ts` | Create |
| PR Navigator UI | `src/client/pages/PRNavigator.tsx` | Create |
| DiffViewer | `src/client/components/DiffViewer.tsx` | Create |

### 4.2 Dependencies
| Type | Dependency | Status |
|------|------------|--------|
| **Requires** | EPIC-001 (Server, DB) | Must be complete |
| **Requires** | EPIC-002 (Repos connected) | Must be complete |
| **Requires** | EPIC-005 (Analyzer engine) | Must be complete |
| **Unlocks** | EPIC-008 (Branch-level trending) | Waiting |

### 4.3 Integration Points
| System | Purpose | Notes |
|--------|---------|-------|
| `git` CLI | Branch listing, diff stats, log | Shell exec |
| Analyzer engine | Run analysis on specific branch | From EPIC-005 |
| `.vibelint/reviews/` | Read agent-written review files | Filesystem read |

---

## 5. Decomposition Guidance
> Hints for AI story breakdown. Check all that apply.

- [ ] **Schema/Migration** - No schema changes
- [x] **API Work** - Branch listing, per-branch analysis endpoints
- [x] **UI Work** - PR Navigator page, DiffViewer component
- [x] **Integration** - Git CLI for diffs, branch listing
- [ ] **Bug Fixes** - Greenfield
- [ ] **Hygiene** - N/A
- [ ] **Testing** - Git command parsing tests

### Suggested Story Sequence
1. **STORY-006-01**: Git diff parser — compare branches, extract file stats
2. **STORY-006-02**: Git history utilities — branch list, commit log
3. **STORY-006-03**: REST API — branch listing with diff stats
4. **STORY-006-04**: REST API — per-branch analysis trigger and results
5. **STORY-006-05**: Review file reader — detect and serve `.vibelint/reviews/*.md`
6. **STORY-006-06**: Frontend — PR Navigator page (branch list, drill-down)
7. **STORY-006-07**: Frontend — DiffViewer component

---

## 6. Risks & Edge Cases
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Repo has hundreds of branches | Medium | Paginate, show recent/active first |
| Branch has no common ancestor with main | Low | Handle merge-base errors gracefully |
| Analyzing a non-checked-out branch | Medium | Use `git diff` without checkout, or temp worktree |
| Review files don't exist yet | High | Show "No reviews yet" with instructions |
| Large diffs overflow the UI | Medium | Collapse files by default, paginate |

---

## 7. Acceptance Criteria (Epic-Level)
> How do we know the EPIC is complete? Full user flow.

```gherkin
Feature: PR & Branch Navigation

  Scenario: View branch list
    Given a repo has 5 branches
    When the user opens the PR Navigator
    Then all 5 branches are listed with diff stats vs main

  Scenario: Branch analysis
    Given the user selects branch "feature/auth"
    When they click "Analyze"
    Then the analyzer runs on the branch's changes
    And results are displayed inline

  Scenario: View diff details
    Given a branch has 12 files changed
    When the user drills into the branch
    Then the DiffViewer shows each file with +/- line counts
    And files can be expanded to see change details

  Scenario: View agent review
    Given the AI agent has written .vibelint/reviews/feature-auth.md
    When the user views the "feature/auth" branch
    Then the review content is displayed alongside analysis results

  Scenario: No reviews available
    Given no review files exist in .vibelint/reviews/
    When the user views a branch
    Then a message says "No AI review yet. Use /review in your coding agent."
```

---

## 8. Open Questions
| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| How to match review files to branches? | A: Filename convention (branch-name.md), B: Frontmatter metadata | Review linking | Eng | Leaning A |
| Show remote branches or local only? | A: Local only, B: Local + remote tracking | Scope | Eng | Leaning A |
| Diff viewer — full unified diff or summary only? | A: Full diff (complex), B: Summary stats + file list | UI complexity | Eng | Leaning B initially |

---

## 9. Artifact Links
> Auto-populated as Epic is decomposed.

**Stories:**
- [ ] STORY-006-01: Git Diff Parser
- [ ] STORY-006-02: Git History Utilities
- [ ] STORY-006-03: Branch Listing API
- [ ] STORY-006-04: Per-Branch Analysis API
- [ ] STORY-006-05: Review File Reader
- [ ] STORY-006-06: PR Navigator Page
- [ ] STORY-006-07: DiffViewer Component

**References:**
- PRD: [PRD.md](../PRD.md)
- PRD PR/Branch Navigator: PRD.md lines 379-386
- PRD Sprint 4: PRD.md lines 832-846
