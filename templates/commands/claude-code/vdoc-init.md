# Initialize Feature Documentation (vdoc)

Create a new vdoc (VibeLint documentation file) for a feature or module.

## Instructions

1. **Determine the feature scope.**
   Identify which feature or module to document, its source files, and dependencies.

2. **Create the vdoc directory.**
   Ensure `.vibelint/vdocs/` exists. Name the file using kebab-case:
   `.vibelint/vdocs/[feature-name].md`

3. **Analyze the feature.**
   Read the source files and extract: purpose, public API surface,
   dependencies, data flow, and error handling patterns.

4. **Generate the vdoc with standard sections.**

```markdown
# [Feature Name]

## Purpose
[What this feature does and why it exists]

## Architecture
[High-level design and component interactions]

## Public API
- `functionName(params)` — [brief description]

## Dependencies
- Internal: [list internal module dependencies]
- External: [list third-party package dependencies]

## Data Flow
[How data moves through this feature]

## Configuration
[Configuration options or environment variables]

## Error Handling
[How errors are handled and propagated]

## Testing
[Existing test coverage and testing approach]

## Known Issues
- [Known issues, limitations, or technical debt]
```

5. **Confirm creation.**
   Report the file path and summarize what was documented.

## Notes
- Base documentation on real code analysis, not assumptions.
- Mark sections as "[Not yet documented]" if information is unavailable.
- Keep descriptions concise but accurate.
