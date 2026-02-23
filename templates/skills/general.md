# General Coding Best Practices

## Naming Conventions

- Use descriptive, intention-revealing names for all variables, functions, and classes.
- Prefer full words over abbreviations: `customerAddress` not `custAddr`.
- Use consistent casing per language convention (camelCase, snake_case, PascalCase).
- Name booleans as predicates: `isActive`, `hasPermission`, `canEdit`.
- Avoid single-letter variables except in short lambda expressions or loop indices.

## Function Design

- Keep functions small: aim for 20 lines or fewer.
- Each function must do exactly one thing (Single Responsibility Principle).
- Limit parameters to three or fewer; group related parameters into an object or struct.
- Return early to avoid deep nesting:

```
function process(input) {
  if (!input) return null;
  if (!input.isValid) return null;

  // main logic here
  return transform(input);
}
```

- Prefer pure functions with no side effects when possible.

## DRY Principle

- Extract repeated logic into shared functions or modules.
- Do not duplicate string literals; define them as named constants.
- Consolidate similar conditional branches into a single parameterized path.
- Balance DRY with readability: two occurrences may not justify abstraction.

## SOLID Basics

- **Single Responsibility**: Each module or class should have one reason to change.
- **Open/Closed**: Design modules to be extended without modifying existing code.
- **Liskov Substitution**: Subtypes must be substitutable for their base types.
- **Interface Segregation**: Prefer many small interfaces over one large interface.
- **Dependency Inversion**: Depend on abstractions, not concrete implementations.

## Code Readability

- Write code that reads like well-structured prose; minimize cognitive load.
- Use vertical whitespace to separate logical sections within a function.
- Keep line length under 100 characters.
- Prefer explicit over clever; avoid obscure language tricks.
- Structure files consistently: imports, constants, types, main logic, exports.

## Comments

- Write comments only to explain **why**, never **what** the code does.
- Keep comments up to date; stale comments are worse than no comments.
- Use doc comments on public APIs to describe purpose, parameters, and return values.
- Remove commented-out code; rely on version control for history.
- Use TODO comments sparingly and include a tracking reference:

```
// TODO(PROJ-123): Replace with batch API once available
```

## Error Handling

- Never silently swallow errors; always log or propagate.
- Fail fast: validate inputs at function boundaries.
- Use structured error types rather than generic error strings.
- Separate expected failures (validation) from unexpected errors (system faults).

## Code Organization

- Group related functionality into cohesive modules or packages.
- Keep import lists organized: standard library first, then third-party, then local.
- Place constants and configuration at the top of the file.
- Limit file length to 300 lines; split when a file covers multiple concerns.
