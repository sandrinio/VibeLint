# Lessons Learned

### [2026-02-23] VibeLint repo is its own test fixture
**What happened:** VibeLint has no git repo initialized yet. One test scenario is to add the VibeLint repo itself as a managed repository in the app to test repo management, skills, rules, and commands features against real data.
**Rule:** Always treat the VibeLint repo as a valid test target. When testing repo-related features, add the VibeLint project directory itself as a test repo.
