---
name: Using Git Worktrees
description: How to safely create and use git worktrees for isolated development tasks
---

# Using Git Worktrees

This skill guides you through the process of creating and using git worktrees. Worktrees allow you to check out multiple branches of the same repository into different directories, enabling parallel development without context switching overhead or risking your main working directory.

## Directory Selection Process

When asked to "create a worktree" or "start a new task in a worktree":

1.  **Check Existing Directories:** Look for a `.worktrees/` folder in the project root. If it exists, use it.
2.  **Check CLAUDE.md:** Look for a `worktrees_dir` setting in `CLAUDE.md`.
3.  **Ask User:** If neither exists, ask the user where they prefer to store worktrees. Suggest `.worktrees/` (project-local, good for isolation) or `~/.config/superpowers/worktrees/` (global, keeps project root clean).

## Safety Verification

Before creating a worktree, verify it won't be indexed by tools or accidentally committed:

**For Project-Local Directories (`.worktrees/`):**
- Check `.gitignore`. Ensure `.worktrees/` is ignored.
- If not ignored, **STOP**. Ask the user for permission to add it to `.gitignore`.

**For Global Directory:**
- Ensure the path is outside the current project's scan scope if possible, or effectively ignored.

## Creation Steps

1.  **Detect Project Name:** Get the current project name (e.g., from `package.json` or directory name).
2.  **Create Worktree:**
    ```bash
    # Syntax: git worktree add <path> <branch>
    git worktree add .worktrees/<task-name> -b <feature/task-name> origin/main
    ```
3.  **Run Project Setup:**
    - `npm install` (or `pnpm`, `yarn` as appropriate)
    - Copy `.env` from main project if needed (ask user or check safe list).
4.  **Verify Clean Baseline:** Run a quick build or test to ensure the fresh worktree is stable.
5.  **Report Location:** Tell the user the absolute path to the new worktree and switching context.

## Common Mistakes
- **Skipping ignore verification:** Can lead to committing the worktree folder itself.
- **Assuming directory location:** Always look for existing conventions first.
- **Proceeding with failing tests:** A broken baseline makes it hard to verify your changes.

## Example Workflow
User: "Refactor the sidebar in a worktree"
Agent:
1. Checks for `.worktrees/` (Found).
2. Checks `.gitignore` (Ignored).
3. Runs `git worktree add .worktrees/refactor-sidebar -b feature/refactor-sidebar origin/main`.
4. Runs `npm install` in the new directory.
5. Verifies build.
6. Switches context to `.worktrees/refactor-sidebar`.


---
