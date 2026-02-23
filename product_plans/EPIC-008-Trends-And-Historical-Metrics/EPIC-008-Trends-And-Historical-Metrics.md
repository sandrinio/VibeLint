# EPIC-008: Trends & Historical Metrics

## Metadata
| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Ambiguity** | Medium |
| **Context Source** | [PRD v4](../PRD.md) — Sprint 5: Trends + Polish |
| **Owner** | Engineering |
| **Priority** | P2 - Medium |
| **Tags** | #trends, #metrics, #charts, #history, #snapshots |
| **Target Date** | TBD |

---

## 1. Problem & Value
> Target Audience: Stakeholders, Business Sponsors

### 1.1 The Problem
Developers and tech leads have no visibility into how code quality changes over time. A single analysis snapshot shows current state but can't answer: "Is complexity growing? Is duplication getting better or worse? Are we shipping more dependencies?" Without historical tracking, quality regressions go unnoticed until they become painful.

### 1.2 The Solution
A metrics trending system that stores analysis snapshots in SQLite, computes week-over-week deltas, and displays line charts on a dedicated Trends page. Users can run a "Full Scan" to capture a fresh snapshot, and the dashboard shows directional indicators (improving/declining) for each metric.

### 1.3 Success Metrics (North Star)
- Trends page shows line charts for complexity, duplication, dependency count, file sizes
- Week-over-week comparison shows improvement or regression
- "Run Full Scan" captures a new snapshot for trending
- Historical data persists across server restarts (SQLite)

---

## 2. Scope Boundaries
> Target Audience: AI Agents (Critical for preventing hallucinations)

### IN-SCOPE (Build This)
- [ ] Metric snapshot system — capture analysis results as timestamped snapshots
- [ ] Trend computation — week-over-week deltas, directional indicators
- [ ] REST API: trends endpoints (`src/server/api/trends.ts`) — get history, get deltas
- [ ] REST API: "Full Scan" trigger — run analysis and store snapshot
- [ ] Frontend: Trends page (`src/client/pages/Trends.tsx`) with line charts
- [ ] Frontend: TrendChart component (`src/client/components/TrendChart.tsx`)
- [ ] Dashboard repo cards — add directional trend indicators

### OUT-OF-SCOPE (Do NOT Build This)
- Automated scheduled analysis (EPIC-009)
- Branch-specific trending (future enhancement)
- Export/reporting (EPIC-009)
- Alert/notification system

---

## 3. Context

### 3.1 User Personas
- **Tech Lead**: Monitors quality trends across sprints, reports to management
- **Developer**: Wants to see impact of their refactoring work over time
- **Team**: Shared understanding of codebase health trajectory

### 3.2 Constraints
| Type | Constraint |
|------|------------|
| **Storage** | SQLite `metrics_history` table, JSON blobs |
| **Charts** | Need a client-side charting library (Chart.js, Recharts, or similar) |
| **Data** | At least 2 snapshots needed to show a trend |
| **Performance** | Trend queries should be fast (indexed by repo_id + timestamp) |

---

## 4. Technical Context
> Target Audience: AI Agents — READ THIS before decomposing.

### 4.1 Affected Areas
| Area | Files/Modules | Change Type |
|------|---------------|-------------|
| Trends API | `src/server/api/trends.ts` | Create |
| Snapshot logic | extend `src/server/analyzer/engine.ts` | Modify |
| Trends UI | `src/client/pages/Trends.tsx` | Create |
| TrendChart | `src/client/components/TrendChart.tsx` | Create |
| Dashboard | `src/client/pages/Dashboard.tsx` | Modify (add trend indicators) |

### 4.2 Dependencies
| Type | Dependency | Status |
|------|------------|--------|
| **Requires** | EPIC-001 (SQLite, metrics_history table) | Must be complete |
| **Requires** | EPIC-005 (Analyzer engine produces data) | Must be complete |
| **External** | Chart.js / Recharts (npm) | Install at epic start |

### 4.3 Integration Points
| System | Purpose | Notes |
|--------|---------|-------|
| SQLite `metrics_history` | Store/retrieve snapshots | Indexed queries |
| Analyzer engine | Produce metrics for snapshots | From EPIC-005 |
| Chart library | Render line charts | Client-side dependency |

---

## 5. Decomposition Guidance
> Hints for AI story breakdown. Check all that apply.

- [ ] **Schema/Migration** - Uses existing metrics_history table
- [x] **API Work** - Trends endpoints
- [x] **UI Work** - Trends page, TrendChart component
- [ ] **Integration** - Chart library setup
- [ ] **Bug Fixes** - Greenfield
- [ ] **Hygiene** - N/A
- [ ] **Testing** - Trend computation tests

### Suggested Story Sequence
1. **STORY-008-01**: Metric snapshot system — store analysis results as timestamped records
2. **STORY-008-02**: Trend computation — week-over-week deltas, directional indicators
3. **STORY-008-03**: REST API — trends endpoints (history, deltas, full scan trigger)
4. **STORY-008-04**: Frontend — TrendChart component (line charts)
5. **STORY-008-05**: Frontend — Trends page (all metric charts, comparison view)
6. **STORY-008-06**: Dashboard — add trend indicators to repo cards

---

## 6. Risks & Edge Cases
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Only 1 snapshot exists (no trend to show) | High (early use) | Show "Need more data" message, encourage regular scans |
| Chart library adds significant bundle size | Medium | Lazy load the Trends page |
| Too many snapshots slow down queries | Low | Limit to last 90 days, or aggregate older data |
| Metrics schema changes between versions | Low | Version the JSON blob format |

---

## 7. Acceptance Criteria (Epic-Level)
> How do we know the EPIC is complete? Full user flow.

```gherkin
Feature: Trends & Historical Metrics

  Scenario: Capture a snapshot
    Given the analyzer has run at least once
    When the user clicks "Run Full Scan"
    Then a new metrics snapshot is stored with a timestamp
    And the Trends page updates to include the new data point

  Scenario: View trend charts
    Given 3 or more snapshots exist for a repo
    When the user opens the Trends page
    Then line charts show complexity, duplication, dependency count, file sizes over time

  Scenario: Week-over-week comparison
    Given snapshots from this week and last week exist
    When the user views the Trends page
    Then each metric shows a delta (e.g., "Complexity: +5 from last week")

  Scenario: Trend indicators on dashboard
    Given trends data exists for a repo
    When the user views the Dashboard home
    Then the repo card shows directional indicators (arrow up/down)
```

---

## 8. Open Questions
| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| Which chart library? | A: Recharts (React-native), B: Chart.js (lighter), C: D3 (flexible, complex) | Bundle size, dev effort | Eng | Leaning A |
| How often to auto-capture snapshots? | A: Manual only, B: Daily, C: On every analysis run | Data volume | Eng | Leaning C |
| Show absolute values or deltas in charts? | A: Both (dual axis), B: Absolute with delta annotations | Chart clarity | Eng | Leaning B |

---

## 9. Artifact Links
> Auto-populated as Epic is decomposed.

**Stories:**
- [ ] STORY-008-01: Metric Snapshot System
- [ ] STORY-008-02: Trend Computation
- [ ] STORY-008-03: Trends API
- [ ] STORY-008-04: TrendChart Component
- [ ] STORY-008-05: Trends Page
- [ ] STORY-008-06: Dashboard Trend Indicators

**References:**
- PRD: [PRD.md](../PRD.md)
- PRD Trends: PRD.md lines 388-394
- PRD Data Layer: PRD.md lines 595-634
- PRD Sprint 5: PRD.md lines 848-864
