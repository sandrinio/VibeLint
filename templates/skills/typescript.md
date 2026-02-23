# TypeScript

## Strict Typing

- Enable `strict: true` in `tsconfig.json` at all times.
- Never use `any`; use `unknown` when the type is genuinely uncertain, then narrow with type guards.
- Annotate function return types explicitly to catch unintended changes.
- Prefer `readonly` properties and `ReadonlyArray` for data that should not be mutated.

## Interfaces vs Types

- Use `interface` for object shapes that may be extended or implemented by classes.
- Use `type` for unions, intersections, mapped types, and computed types.
- Do not mix both for the same concept within a single codebase; pick a convention and follow it.

```typescript
// Prefer interface for object shapes
interface User {
  readonly id: string;
  name: string;
  email: string;
}

// Prefer type for unions and computed types
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
```

## Async/Await Patterns

- Always use `async`/`await` over raw `.then()` chains.
- Wrap awaited calls in `try`/`catch` with typed error handling.
- Use `Promise.all` for independent concurrent operations, not sequential awaits.
- Avoid fire-and-forget promises; always handle or return them.

## Error Handling

- Define typed error classes that extend `Error` with a `code` property.
- Use discriminated unions for Result types instead of throwing in library code.
- Always type catch clause variables as `unknown` and narrow before accessing properties:

```typescript
try {
  await fetchData();
} catch (err: unknown) {
  if (err instanceof HttpError) {
    logger.warn(`HTTP ${err.statusCode}: ${err.message}`);
  } else {
    throw err;
  }
}
```

## Discriminated Unions

- Always include a literal `kind` or `type` field as the discriminant.
- Use exhaustive switch statements with a `never` default to catch unhandled cases.
- Prefer discriminated unions over optional fields for modeling distinct states.

## Utility Types

- Use `Partial<T>`, `Required<T>`, `Pick<T, K>`, and `Omit<T, K>` to derive types.
- Prefer `Record<K, V>` over hand-written index signatures.
- Use `Extract` and `Exclude` for filtering union members.
- Define reusable generic utility types for common project patterns.

## Module Organization

- Use barrel exports (`index.ts`) to create clean public APIs for each module.
- Configure path aliases in `tsconfig.json` to avoid deep relative imports.
- Export types separately from runtime values when using `isolatedModules`.
- Keep each file focused on a single concern; split large files by responsibility.

## General Guidelines

- Prefer `const` assertions for literal types: `as const`.
- Use enums sparingly; prefer string literal unions for serializable values.
- Enable `noUncheckedIndexedAccess` to force undefined checks on array/object access.
- Use template literal types for string pattern validation where appropriate.
