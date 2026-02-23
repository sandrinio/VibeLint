# EPIC-005: Analyzer Engine

## Metadata
| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Ambiguity** | Medium |
| **Context Source** | [PRD v4](../PRD.md) — Sprint 3: Analyzer Engine |
| **Owner** | Engineering |
| **Priority** | P1 - High |
| **Tags** | #analyzer, #complexity, #duplication, #reports, #static-analysis |
| **Target Date** | TBD |

---

## 1. Problem & Value
> Target Audience: Stakeholders, Business Sponsors

### 1.1 The Problem
The AI coding agent has no objective code quality data when doing reviews. Developers have no visibility into complexity growth, code duplication, or error handling gaps. Without analysis data, code reviews are opinion-based rather than evidence-based.

### 1.2 The Solution
A static analysis pipeline that runs from the dashboard (or on schedule) and writes human+AI-readable reports to `.vibelint/reports/latest.md`. The pipeline includes complexity analysis (Lizard), duplication detection (jscpd), error handling pattern checks, file/function size checks, dependency detection, and coupling analysis. Results are stored in SQLite for trending and displayed on the Analysis View page.

### 1.3 Success Metrics (North Star)
- "Run Analysis" produces a complete report within 30 seconds for typical repos
- `.vibelint/reports/latest.md` is readable by both humans and AI agents
- Analysis results are stored in SQLite for historical tracking
- Dashboard shows summary table with pass/warn/fail indicators
- The `/review` slash command can reference analysis data

---

## 2. Scope Boundaries
> Target Audience: AI Agents (Critical for preventing hallucinations)

### IN-SCOPE (Build This)
- [ ] Complexity analysis via Lizard CLI wrapper (`src/server/analyzer/complexity.ts`)
- [ ] Code duplication detection via jscpd wrapper (`src/server/analyzer/duplication.ts`)
- [ ] Error handling pattern detection via regex (`src/server/analyzer/error-patterns.ts`)
- [ ] File size and function size checks (`src/server/analyzer/file-size.ts`)
- [ ] New dependency detection via manifest diff (`src/server/analyzer/dependencies.ts`)
- [ ] Coupling analysis via git diff (`src/server/analyzer/coupling.ts`)
- [ ] Language detector (`src/server/analyzer/languages/detector.ts`)
- [ ] Analysis pipeline orchestrator (`src/server/analyzer/engine.ts`)
- [ ] Report writer — generates `.vibelint/reports/latest.md`
- [ ] REST API: analysis endpoints — trigger, view results (`src/server/api/analysis.ts`)
- [ ] Frontend: Analysis View page with summary + detail (`src/client/pages/AnalysisView.tsx`)
- [ ] Frontend: AnalysisSummary component (`src/client/components/AnalysisSummary.tsx`)
- [ ] Store analysis results in SQLite `analyses` table

### OUT-OF-SCOPE (Do NOT Build This)
- Trend charts over time (EPIC-008)
- Per-branch analysis / branch comparison (EPIC-006)
- Scheduled/automatic analysis runs (EPIC-009)
- AI-powered analysis or suggestions (out of scope entirely)

---

## 3. Context

### 3.1 User Personas
- **Developer**: Wants quick feedback on code quality before asking for AI review
- **Tech Lead**: Wants to monitor complexity and duplication trends
- **AI Agent**: Reads `.vibelint/reports/latest.md` during `/review` to ground feedback in data

### 3.2 Constraints
| Type | Constraint |
|------|------------|
| **External Tools** | Lizard requires Python (`pip install lizard`); jscpd is npm-native |
| **Performance** | Analysis should complete in < 30s for repos with < 10K files |
| **Report Format** | Markdown with tables — readable by both humans and AI agents |
| **Languages** | Must support: TypeScript/JS, Python, Go, Java, Rust, C#, Ruby |

---

## 4. Technical Context
> Target Audience: AI Agents — READ THIS before decomposing.

### 4.1 Affected Areas
| Area | Files/Modules | Change Type |
|------|---------------|-------------|
| Complexity | `src/server/analyzer/complexity.ts` | Create |
| Duplication | `src/server/analyzer/duplication.ts` | Create |
| Error patterns | `src/server/analyzer/error-patterns.ts` | Create |
| File size | `src/server/analyzer/file-size.ts` | Create |
| Dependencies | `src/server/analyzer/dependencies.ts` | Create |
| Coupling | `src/server/analyzer/coupling.ts` | Create |
| Language detector | `src/server/analyzer/languages/detector.ts` | Create |
| Engine | `src/server/analyzer/engine.ts` | Create |
| Analysis API | `src/server/api/analysis.ts` | Create |
| Analysis View UI | `src/client/pages/AnalysisView.tsx` | Create |
| AnalysisSummary | `src/client/components/AnalysisSummary.tsx` | Create |
| MetricCard | `src/client/components/MetricCard.tsx` | Create |

### 4.2 Dependencies
| Type | Dependency | Status |
|------|------------|--------|
| **Requires** | EPIC-001 (SQLite, server) | Must be complete |
| **Requires** | EPIC-002 (Repos connected) | Must be complete |
| **Requires** | EPIC-004 (`.vibelint/reports/` dir exists in repo) | Should be complete |
| **External** | Lizard CLI (`pip install lizard`) | User must install |
| **External** | jscpd (`npm install -g jscpd` or bundled) | Bundled or user install |
| **Unlocks** | EPIC-006 (Per-branch analysis) | Waiting |
| **Unlocks** | EPIC-008 (Trend data) | Waiting |

### 4.3 Integration Points
| System | Purpose | Notes |
|--------|---------|-------|
| Lizard CLI | Cyclomatic complexity | Shell exec, parse JSON output |
| jscpd | Duplication detection | Shell exec or programmatic API |
| Git CLI | Diff stats for coupling, dependency diffs | Shell exec |
| Filesystem | Read source files, write report | `fs.readFile`, `fs.writeFile` |
| SQLite `analyses` table | Store structured results | INSERT per analysis run |
| SQLite `metrics_history` table | Store snapshot for trending | INSERT per snapshot |

---

## 5. Decomposition Guidance
> Hints for AI story breakdown. Check all that apply.

- [ ] **Schema/Migration** - Uses existing schema
- [x] **API Work** - Analysis trigger + results endpoints
- [x] **UI Work** - Analysis View page, summary component, metric cards
- [x] **Integration** - Lizard CLI, jscpd, git CLI wrappers
- [ ] **Bug Fixes** - Greenfield
- [ ] **Hygiene** - N/A
- [x] **Testing** - Analyzer unit tests with fixture repos

### Suggested Story Sequence
1. **STORY-005-01**: Language detector — identify languages in a repo
2. **STORY-005-02**: File size + function size checker
3. **STORY-005-03**: Error handling pattern detector (regex per language)
4. **STORY-005-04**: Complexity analysis — Lizard CLI wrapper
5. **STORY-005-05**: Duplication detection — jscpd wrapper
6. **STORY-005-06**: Dependency detection — manifest diff parser
7. **STORY-005-07**: Coupling analysis — git diff file/dir counting
8. **STORY-005-08**: Analysis engine — orchestrate all checks, generate report
9. **STORY-005-09**: REST API — trigger analysis, view results
10. **STORY-005-10**: Frontend — Analysis View page with summary + details

---

## 6. Risks & Edge Cases
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Lizard not installed (Python dependency) | High | Graceful fallback — skip complexity check, show warning |
| jscpd slow on large repos | Medium | Set file count limit, timeout |
| Analysis takes too long (> 60s) | Medium | Run async, show progress, allow cancellation |
| Regex false positives in error pattern detection | Medium | Tune patterns per language, allow threshold config |
| Empty repo (no source files) | Low | Handle gracefully, show "no files to analyze" |
| Binary files accidentally analyzed | Low | Filter by extension using language detector |

---

## 7. Acceptance Criteria (Epic-Level)
> How do we know the EPIC is complete? Full user flow.

```gherkin
Feature: Analyzer Engine

  Scenario: Run analysis from dashboard
    Given a repo is connected with TypeScript files
    When the user clicks "Run Analysis"
    Then the analysis pipeline runs all applicable checks
    And results are displayed on the Analysis View page
    And .vibelint/reports/latest.md is written to the repo

  Scenario: Analysis report is AI-readable
    Given an analysis has completed
    When the AI agent reads .vibelint/reports/latest.md
    Then it contains a markdown summary table with check, status, and details
    And it contains per-file breakdown for failing checks

  Scenario: Complexity check
    Given the repo has a function with cyclomatic complexity > threshold
    When analysis runs
    Then the complexity check shows WARN or FAIL
    And the specific function is identified in the details

  Scenario: Duplication check
    Given the repo has a duplicated code block > 10 lines
    When analysis runs
    Then the duplication check shows FAIL
    And the duplicate locations are listed

  Scenario: Results stored for history
    Given an analysis completes
    Then a record is inserted into the analyses table
    And a snapshot is inserted into metrics_history
```

---

## 8. Open Questions
| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| Bundle jscpd or require user install? | A: Bundle as dependency, B: Require global install | Install experience | Eng | Leaning A |
| Graceful fallback when Lizard missing? | A: Skip complexity (warn), B: Error out, C: Use TS-native alternative | Reliability | Eng | Leaning A |
| Analysis thresholds — where configured? | A: `.vibelint/config.yml` (per-repo), B: Dashboard settings | Flexibility | Eng | Leaning A |
| Async analysis with progress? | A: Yes (WebSocket/SSE), B: Sync (block until done) | UX for large repos | Eng | Leaning A |

---

## 9. Artifact Links
> Auto-populated as Epic is decomposed.

**Stories:**
- [ ] STORY-005-01: Language Detector
- [ ] STORY-005-02: File & Function Size Checker
- [ ] STORY-005-03: Error Handling Pattern Detector
- [ ] STORY-005-04: Complexity Analysis (Lizard)
- [ ] STORY-005-05: Duplication Detection (jscpd)
- [ ] STORY-005-06: Dependency Detection
- [ ] STORY-005-07: Coupling Analysis
- [ ] STORY-005-08: Analysis Engine & Report Writer
- [ ] STORY-005-09: Analysis API
- [ ] STORY-005-10: Analysis View UI

**References:**
- PRD: [PRD.md](../PRD.md)
- PRD Analyzer Engine: PRD.md lines 519-565
- PRD Analysis View: PRD.md lines 369-377
- PRD Sprint 3: PRD.md lines 815-830
- PRD Analysis Report Format: PRD.md lines 542-561
