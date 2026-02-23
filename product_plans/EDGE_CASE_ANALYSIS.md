# VibeLint Edge Case Analysis

*Comprehensive review of unaddressed edge cases across all 9 epics and 62 stories.*

---

## Executive Summary

Analysis identified **47 actionable edge cases** across 12 categories. These are cases NOT already covered in the epic/story risk sections. Grouped by severity:

- **Critical (must fix before ship):** 10
- **High (should fix before ship):** 15
- **Medium (fix in v0.2+):** 14
- **Low (document and monitor):** 8

---

## Critical Severity

These will cause data loss, security vulnerabilities, or broken core flows if unaddressed.

### C1. API Key Stored in Plaintext
- **Where:** EPIC-002 (Setup Wizard), EPIC-009 (Settings)
- **Problem:** User enters Anthropic API key in wizard Panel 3. `PUT /api/config/api_key` stores it as plain text in SQLite `config` table. If machine is compromised, keys are exposed.
- **Fix:** Encrypt at rest using OS keychain (macOS Keychain, Windows Credential Manager) or at minimum `crypto.createCipheriv` with a machine-derived key.

### C2. No Database Migration Strategy
- **Where:** EPIC-001 (Schema), EPIC-009 (npm Publish)
- **Problem:** Schema is created once in STORY-001-04. When v0.2.0 adds a column, existing users' DBs don't match. App crashes on startup.
- **Fix:** Add schema versioning table + migration runner. Check version on startup, run pending migrations.

### C3. Server Binds to 0.0.0.0 (Network Exposure)
- **Where:** EPIC-001 (Fastify Server)
- **Problem:** If Fastify binds to `0.0.0.0`, the entire API is accessible to anyone on the local network. No authentication exists on any endpoint.
- **Fix:** Bind to `127.0.0.1` by default. Require explicit `--host 0.0.0.0` flag for network access.

### C4. Command Injection via Repo Paths
- **Where:** EPIC-002 (Git Scanner), EPIC-005 (Analyzer), EPIC-006 (Git Diff)
- **Problem:** Repo paths are interpolated into shell commands (`git branch -a` in repo path). A path like `/tmp/repo; rm -rf ~/` would execute arbitrary commands.
- **Fix:** Never interpolate paths into shell strings. Use `execFile` (array args) instead of `exec` (string). Or use `child_process.spawn` with `cwd` option.

### C5. Path Traversal via Repo Path Input
- **Where:** EPIC-002 (Repo CRUD API)
- **Problem:** User enters `../../etc/passwd` as repo path. If VibeLint reads files relative to this, it escapes expected boundaries.
- **Fix:** `path.resolve()` the input, then verify it's a real directory with `.git`. Never follow paths outside the resolved root.

### C6. XSS via Markdown Rendering
- **Where:** EPIC-003 (Markdown Editor, File Preview)
- **Problem:** Skill/rule content is user-authored markdown rendered as HTML in the preview pane. Raw `<script>` tags execute in browser.
- **Fix:** Use DOMPurify to sanitize all rendered HTML. Already mentioned as risk in EPIC-003 but not in any story's implementation guide.

### C7. Injection Overwrites User's Existing CLAUDE.md
- **Where:** EPIC-004 (Claude Code Injector)
- **Problem:** User has a hand-written `CLAUDE.md` with project-specific rules. VibeLint injection blindly overwrites it with generated content. User loses their manual work.
- **Fix:** Detect existing files before injection. Offer: backup (`.CLAUDE.md.bak`), merge (append VibeLint section with markers), or skip.

### C8. SQLite DB Corruption with No Recovery
- **Where:** EPIC-001 (Database)
- **Problem:** Unclean shutdown, disk full, or cloud sync (iCloud/Dropbox syncing `~/.vibelint/`) corrupts the SQLite database. All repos, analysis history, and customizations are lost.
- **Fix:** Run `PRAGMA integrity_check` on startup. If failed, offer "Reset database" option. Consider periodic backup to `vibelint.db.bak`.

### C9. Wizard State Lost on Browser Close
- **Where:** EPIC-002 (Setup Wizard)
- **Problem:** User completes Panel 1-2 (selects platform, adds repos), then accidentally closes the browser tab. All wizard state is in React component state (memory only). User must restart from scratch.
- **Fix:** Save wizard progress to the API after each panel. On re-visit, resume from last completed panel.

### C10. Two VibeLint Instances Corrupt Each Other
- **Where:** EPIC-001 (Server + DB)
- **Problem:** User runs `vibelint` in two terminals. Both bind port 3847 (second fails), but both open the same SQLite database file concurrently. Write contention can corrupt data.
- **Fix:** Create a lockfile at `~/.vibelint/vibelint.lock` on startup. If exists, show "VibeLint is already running at PID X".

---

## High Severity

These cause confusing failures, incorrect data, or degraded UX.

### H1. Bare Git Repositories
- **Where:** EPIC-002 (Git Scanner)
- **Problem:** Scanner checks for `.git` existence but doesn't distinguish bare repos (no working directory). Injection and analysis both fail with cryptic errors.
- **Fix:** Check `git rev-parse --is-bare-repository` and reject with clear message.

### H2. Shallow Clones
- **Where:** EPIC-005 (Coupling Analysis), EPIC-006 (Git Diff)
- **Problem:** `git clone --depth 1` repos have truncated history. Coupling analysis and branch comparisons produce incomplete/incorrect results.
- **Fix:** Detect via `git rev-parse --is-shallow-repository`. Warn user; disable history-dependent analyses.

### H3. Git Submodules
- **Where:** EPIC-002 (Git Scanner), EPIC-005 (Analyzer)
- **Problem:** In submodules, `.git` is a file (not a directory) pointing to parent. Scanner rejects it. Also, file walking enters submodule directories and double-counts files.
- **Fix:** Handle `.git` files. Add submodule paths to SKIP_DIRS.

### H4. Detached HEAD State
- **Where:** EPIC-002 (Git Scanner), EPIC-006 (Branch Listing)
- **Problem:** `git rev-parse --abbrev-ref HEAD` returns literal "HEAD". Branch-based features show undefined/null.
- **Fix:** Fall back to short commit SHA. Show "detached at abc1234" in UI.

### H5. Branch Name "main" vs "master"
- **Where:** EPIC-005 (Coupling), EPIC-006 (Branch Diff)
- **Problem:** Code defaults to `main` as base branch. Many repos still use `master`. Some use `develop` or `trunk`.
- **Fix:** Auto-detect default branch via `git symbolic-ref refs/remotes/origin/HEAD` or check both `main` and `master`. Store per-repo.

### H6. Generated/Minified Code Inflates Metrics
- **Where:** EPIC-005 (Complexity, Duplication, File Size)
- **Problem:** Committed vendor files, minified bundles, protobuf-generated code, and compiled assets get analyzed. Results show absurd complexity numbers.
- **Fix:** Add configurable exclude patterns in `config.yml`. Ship defaults: `vendor/`, `*.min.js`, `*.pb.go`, `*.generated.*`, `dist/`, `build/`.

### H7. jscpd Temp Directory Race Condition
- **Where:** EPIC-005 (Duplication Detection)
- **Problem:** STORY-005-05 uses `/tmp/jscpd-{id}` for output. If two analyses run simultaneously (different repos), temp dir naming could collide.
- **Fix:** Use `crypto.randomUUID()` or `os.tmpdir() + mkdtemp()` for unique temp dirs. Clean up in finally block.

### H8. Concurrent "Run Analysis" Clicks
- **Where:** EPIC-005 (Analysis API), EPIC-009 (Error Handling)
- **Problem:** User clicks "Run Analysis" twice quickly. Two analyzer instances run simultaneously on same repo. Both write to `.vibelint/reports/latest.md` and `analyses` table.
- **Fix:** Track running analyses per repo. Return 409 Conflict if analysis already in progress. Disable button during run.

### H9. Platform Switch After Injection
- **Where:** EPIC-002 (Wizard), EPIC-004 (Injection)
- **Problem:** User injects for Claude Code (creates `.claude/`, `CLAUDE.md`), then switches platform to Cursor. Re-injection creates `.cursor/` files but leaves old `.claude/` directory orphaned.
- **Fix:** On platform change, detect old platform files and offer to clean them up.

### H10. Repo Path Moved or Renamed
- **Where:** EPIC-002 (Repo CRUD)
- **Problem:** User moves repo from `/home/dev/app` to `/home/dev/projects/app`. DB still points to old path. Dashboard shows repo but all operations fail.
- **Fix:** Validate repo path on dashboard load. If missing, show "Repo not found" with option to update path or remove.

### H11. Gitignore Negation Patterns
- **Where:** EPIC-004 (Gitignore Updater)
- **Problem:** Existing `.gitignore` has `!.vibelint/important.md` (negation). VibeLint appends `.vibelint/` which overrides the negation. User's exception silently breaks.
- **Fix:** Parse gitignore for negation patterns mentioning VibeLint paths. Warn if conflicts detected.

### H12. Empty Git Repo (No Commits)
- **Where:** EPIC-002 (Git Scanner), EPIC-005 (Analyzer)
- **Problem:** `git init` with no commits. `git branch`, `git log`, `git diff` all fail. Scanner crashes.
- **Fix:** Detect via `git rev-parse HEAD` failure. Allow adding repo but disable analysis until first commit.

### H13. User Edits Injected Files Manually
- **Where:** EPIC-004 (Injection)
- **Problem:** User manually edits `.vibelint/skills/typescript.md` in their editor. Later re-injects from VibeLint. Overwrites manual changes without warning.
- **Fix:** Before injection, hash-compare injected files against expected content. If different, warn: "File was modified outside VibeLint. Overwrite?"

### H14. Analysis Timeout on Large Repos
- **Where:** EPIC-005 (Analyzer Engine)
- **Problem:** Repo with 100K+ files. Lizard and jscpd each take 60+ seconds. Total analysis exceeds any reasonable timeout.
- **Fix:** Add per-check timeout (30s default). If exceeded, mark check as "timed out" in report. Return partial results.

### H15. Pre-Commit Hook Runs but Server Not Running
- **Where:** EPIC-009 (Pre-Commit Hook)
- **Problem:** Hook calls `curl localhost:3847/api/...`. Server isn't running. `curl` times out after 5 seconds. Commit is delayed or blocked.
- **Fix:** STORY-009-05 mentions this. Ensure hook has fast health check timeout (1s), skips gracefully, and prints clear message.

---

## Medium Severity

Cause incorrect data, minor UX issues, or affect secondary features.

### M1. WAL Mode + Cloud Sync Corruption
- **Where:** EPIC-001 (SQLite)
- **Problem:** SQLite WAL mode creates `-wal` and `-shm` files. Cloud sync tools (iCloud, Dropbox, OneDrive) may sync these out of order, corrupting the DB.
- **Fix:** Store DB outside cloud-synced directories. Or use `PRAGMA journal_mode = DELETE` for safety.

### M2. Config Table Key Namespace Collisions
- **Where:** EPIC-003 (Skills/Rules/Commands CRUD)
- **Problem:** Keys like `skills:repo1:general` and `rules:repo1:claude-md` use colon-separated namespaces. No enforcement; a bug could write `skills:repo1:general` from the rules API.
- **Fix:** Add key prefix validation in `setConfig()`. Document namespace conventions.

### M3. Skill Content Size Unbounded
- **Where:** EPIC-003 (Skills CRUD)
- **Problem:** User pastes 50MB of content into a custom skill. Stored as JSON in config table. DB bloats. Frontend hangs rendering.
- **Fix:** Enforce max content size (e.g., 500KB per skill). Validate on API write.

### M4. Metrics History Grows Unbounded
- **Where:** EPIC-008 (Trends)
- **Problem:** Every analysis creates a metrics_history row. After 2 years of daily analysis across 10 repos: 7,300 rows. Queries slow down.
- **Fix:** Add retention policy. Keep daily for 90 days, weekly for 1 year, monthly beyond. Or configurable limit.

### M5. Git Worktrees
- **Where:** EPIC-002 (Repos), EPIC-004 (Injection)
- **Problem:** Multiple worktrees of the same repo at different paths. Each can be added as a separate "repo" in VibeLint. Injection goes to one but not others.
- **Fix:** Detect worktrees via `git worktree list`. Warn user; optionally link as related repos.

### M6. Merge/Rebase in Progress
- **Where:** EPIC-006 (PR Navigation)
- **Problem:** Repo is mid-merge or mid-rebase. Git commands return unexpected output. `.git/MERGE_HEAD` exists. Analysis includes conflict markers.
- **Fix:** Detect merge/rebase state. Show warning banner: "Repo has an in-progress merge. Results may be inaccurate."

### M7. Renames Not Tracked in Coupling Analysis
- **Where:** EPIC-005 (Coupling)
- **Problem:** Git tracks file renames, but `git diff --stat` shows them as delete + add. Coupling analysis double-counts: reports 2 files changed when only 1 was renamed.
- **Fix:** Use `git diff --stat -M` (rename detection flag). Parse "rename" entries.

### M8. Binary Files in Analysis
- **Where:** EPIC-005 (File Size, Duplication)
- **Problem:** Images, fonts, compiled files accidentally in source tree. File size checker flags them. jscpd may crash trying to parse them.
- **Fix:** Maintain binary extension list (`.png`, `.jpg`, `.woff`, `.wasm`, etc.). Skip them in all analyzers.

### M9. Test Files Skew Duplication Metrics
- **Where:** EPIC-005 (Duplication)
- **Problem:** Test files often have similar boilerplate (setup, teardown, assertions). jscpd flags them as duplicates, inflating the duplication percentage.
- **Fix:** Allow configuring test file patterns to exclude or weight separately (`*.test.ts`, `*.spec.js`, `*_test.go`).

### M10. vdoc Source Files Missing
- **Where:** EPIC-007 (Freshness Monitor)
- **Problem:** `_manifest.json` references `src/auth/handler.ts` but file was renamed to `src/auth/controller.ts`. `fs.stat` fails. Status becomes "unknown" with no actionable info.
- **Fix:** When source file not found, show "Source file missing: {path}" in the stale reason.

### M11. Clock Skew Between Snapshots
- **Where:** EPIC-008 (Trends)
- **Problem:** System time adjusted backward (NTP sync, timezone change). Two snapshots have reversed timestamps. Trend computation shows negative time delta.
- **Fix:** Sort by insertion order (auto-increment ID), not timestamp. Use ID for ordering.

### M12. Division by Zero in Trends
- **Where:** EPIC-008 (Trend Computation)
- **Problem:** First snapshot has 0 total files (empty repo). Week-over-week delta percentage: `(new - 0) / 0 = Infinity`.
- **Fix:** Guard against zero denominators. Show absolute delta instead of percentage when baseline is 0.

### M13. Report Too Large for Browser
- **Where:** EPIC-005 (Analysis View UI)
- **Problem:** Analysis of large repo flags 5,000 functions with high complexity. Report table has 5,000 rows. Browser rendering freezes.
- **Fix:** Paginate or virtualize large result tables. Show top 50 with "Show all" expand.

### M14. Multiple Browser Tabs Desync
- **Where:** EPIC-002 (Dashboard), all pages
- **Problem:** User opens VibeLint in two tabs. Adds a repo in Tab 1. Tab 2 doesn't know about it until page refresh. Editing same skill in both tabs causes last-write-wins.
- **Fix:** Add `If-Match` / ETag headers for writes. Show "data changed" notification if page is stale.

---

## Low Severity

Edge cases unlikely to occur or with minimal impact.

### L1. Port 3847 Already in Use
- Detect and suggest alternative port or `--port` flag.

### L2. No Default Browser on Headless Server
- Detect headless environment; skip `open()` automatically. Print URL to console.

### L3. Extremely Deep Directory Nesting (250+ levels)
- Validate combined path length before injection. Warn on Windows 260-char limit.

### L4. Gitignore Is a Directory Not a File
- Handle gracefully. Show error: ".gitignore exists but is a directory."

### L5. npm `engines` Field Not Enforced
- Add runtime Node version check in CLI entry point before anything else.

### L6. Repo with Signed Commits Requirement
- Document that VibeLint does not create git commits. Injection writes files only.

### L7. Huge Branch Count (1000+ branches)
- Paginate branch list API. Show most recent 50 by default.

### L8. jscpd Version Incompatibility
- Pin jscpd version in package.json. Document supported version range.

---

## Recommended Actions

### Before Milestone 1
- [ ] Bind Fastify to `127.0.0.1` (not `0.0.0.0`) — **C3**
- [ ] Use `execFile`/`spawn` with array args, never string interpolation — **C4**
- [ ] Add `path.resolve()` + directory validation on repo paths — **C5**
- [ ] Add schema version table + migration runner to DB layer — **C2**
- [ ] Add lockfile check on startup — **C10**

### Before Milestone 3
- [ ] Sanitize markdown preview with DOMPurify — **C6**
- [ ] Add content size limits on skill/rule PUT endpoints — **M3**

### Before Milestone 4
- [ ] Detect existing files before injection, offer backup/merge/skip — **C7**
- [ ] Hash-compare before overwrite — **H13**
- [ ] Handle bare repos, shallow clones, detached HEAD, empty repos — **H1, H2, H4, H12**

### Before Milestone 5
- [ ] Add per-check timeout with partial results — **H14**
- [ ] Use `mkdtemp` for unique temp dirs — **H7**
- [ ] Add configurable exclude patterns for generated/vendor code — **H6**
- [ ] Track running analyses, prevent concurrent runs — **H8**

### Before Milestone 7
- [ ] Encrypt API keys at rest — **C1**
- [ ] Add DB integrity check on startup — **C8**
- [ ] Save wizard state to API per-panel — **C9**
- [ ] Auto-detect default branch (main/master/develop) — **H5**
- [ ] Validate repo paths on dashboard load — **H10**
- [ ] Add metrics retention policy — **M4**
