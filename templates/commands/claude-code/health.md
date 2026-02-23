# Codebase Health Summary

Generate a comprehensive health report for the current codebase.

## Instructions

1. **Load the analysis report.**
   Read the most recent VibeLint analysis report from `.vibelint/reports/`.
   If no report exists, suggest running `vibelint analyze` first.

2. **Summarize overall health.**
   Provide a high-level health rating based on issue count/severity,
   complexity distribution, duplication levels, and coupling metrics.

3. **Identify hot spots.**
   List the top 5-10 files with the most issues, noting the primary
   concern and estimated effort to address each.

4. **Trend analysis.**
   If previous reports exist, compare current vs. previous and note
   issues resolved, new issues introduced, and metric changes.

5. **Prioritized recommendations.**
   Suggest 3-5 high-impact actions ordered by effort-to-impact ratio.

## Expected Output Format

```
## Codebase Health Report

### Overall Health: [Good / Fair / Needs Attention]

### Key Metrics
- Total files analyzed: [N]
- Files with issues: [N]
- Average complexity: [N]
- Duplication ratio: [N%]

### Hot Spots
1. [file path] — [primary issue] — [effort: low/medium/high]

### Trends (vs. Previous Report)
- Improved: [list]
- Degraded: [list]

### Recommended Actions
1. [action] — Impact: [high/medium] — Effort: [low/medium/high]
```

## Notes
- Focus on actionable insights, not just raw numbers.
- Highlight quick wins that can be addressed immediately.
