# Update Stale Documentation (vdoc)

Check existing vdocs for staleness and update them based on recent code changes.

## Instructions

1. **Locate existing vdocs.**
   List all files in `.vibelint/vdocs/`. If none exist, suggest running `vdoc-init`.

2. **Identify recent code changes.**
   Run `git log --oneline -20` and `git diff HEAD~5 --name-only`
   to identify recently changed files.

3. **Map changes to vdocs.**
   For each vdoc, determine which source files it documents and
   cross-reference with changed files to find stale vdocs.

4. **Analyze each stale vdoc.**
   For each potentially stale vdoc, compare its content against current source:
   - New functions or classes not documented
   - Removed or renamed items still referenced
   - Changed signatures or behaviors
   - New or removed dependencies

5. **Update the vdoc.**
   Modify stale vdocs to reflect the current code. Preserve any
   manually written context that is still accurate.

6. **Produce an update summary.**

## Expected Output Format

```
## vdoc Update Summary

### Checked
- [list of all vdocs checked]

### Updated
- `[vdoc-name].md` — [summary of changes made]

### Up to Date
- [vdocs that required no changes]

### Action Required
- [vdocs that need manual review]
```

## Notes
- Never delete manually written context that is still valid.
- When unsure whether something changed, note it for manual review.
- Preserve the original vdoc structure and section ordering.
