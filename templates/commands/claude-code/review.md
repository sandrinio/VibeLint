# Code Review

Review recent code changes against project standards and the VibeLint analysis report.

## Instructions

1. **Identify recent changes.**
   Run `git diff HEAD~1` (or the specified range) to see what has changed.
   If a specific file or directory is provided, scope the review to that area.

2. **Load the analysis report.**
   Read the most recent VibeLint analysis report from `.vibelint/reports/`.

3. **Check against project rules.**
   Read the project's CLAUDE.md and verify that changes comply with coding standards.

4. **Evaluate code quality.**
   For each changed file, check for:
   - Functions exceeding complexity thresholds
   - Duplicated code or logic
   - Missing error handling
   - Potential security concerns (hardcoded secrets, unsanitized input)

5. **Check test coverage.**
   Flag any new logic that lacks corresponding test coverage.

6. **Summarize findings.**

## Expected Output Format

```
## Code Review Summary

### Files Reviewed
- [list of files]

### Issues Found
- **Critical**: [must fix before merge]
- **Warning**: [should be addressed]
- **Suggestion**: [optional improvements]

### Positive Observations
- [things done well]

### Recommendations
- [actionable next steps]
```

## Notes
- Be specific: include file names, line numbers, and code snippets.
- Prioritize issues by severity.
