# Lessons Learned

### [2026-02-23] VibeLint repo is its own test fixture
**What happened:** VibeLint has no git repo initialized yet. One test scenario is to add the VibeLint repo itself as a managed repository in the app to test repo management, skills, rules, and commands features against real data.
**Rule:** Always treat the VibeLint repo as a valid test target. When testing repo-related features, add the VibeLint project directory itself as a test repo.

### [2026-02-23] Mark todo items completed immediately, not in batches
**What happened:** During EPIC-004 implementation, multiple todo items were completed but not marked done until later. The user tracks progress via the todo list and needs real-time visibility.
**Rule:** Always mark each todo item as completed immediately after finishing it. Never batch up completions. The todo list is the user's progress dashboard.
