# Pre-Commit Quality Check

Run a comprehensive quality check on staged or recently modified files before committing.

## Instructions

1. **Identify files to check.**
   Run `git diff --cached --name-only` to find staged files.
   If none are staged, fall back to `git diff --name-only` for unstaged changes.

2. **Run available linters.**
   Check if the project has a configured linter (ESLint, Pylint, Ruff, etc.)
   and run it against the changed files.

3. **Run type checking.**
   If the project uses a type checker (TypeScript, mypy, pyright, etc.),
   run it and report any type errors in the changed files.

4. **Run tests.**
   Execute the project's test suite, scoping to changed files when possible.

5. **Check coding standards.**
   Read the project's rules file and verify:
   - File length and function complexity within limits
   - Naming conventions followed
   - No obvious code duplication introduced

6. **Check for common mistakes.**
   Scan for debugging statements, commented-out code, hardcoded values,
   and missing error handling in async operations.

7. **Produce a pass/fail summary.**

## Expected Output Format

```
## Pre-Commit Check Results

### Status: PASS / FAIL

### Linting: [pass/fail]
### Type Checking: [pass/fail]
### Tests: [pass/fail]
### Standards: [pass/fail]

### Action Required
- [list of issues that must be fixed before committing]
```

## Notes
- Exit early and report if critical issues are found.
- Distinguish between blocking issues and minor warnings.
