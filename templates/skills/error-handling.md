# Error Handling

## Structured Error Types

- Define error types with machine-readable codes and human-readable messages.
- Include contextual data in errors: operation name, input values, and timestamps.
- Categorize errors by kind: validation, authentication, not-found, conflict, internal.
- Never use generic string errors; always use typed or structured error objects.

```typescript
class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
  }
}
throw new AppError("ORDER_NOT_FOUND", `Order ${id} not found`, { orderId: id });
```

## Error Propagation

- Propagate errors up the call stack with added context at each level.
- Wrap low-level errors in domain-specific error types at module boundaries.
- Never lose the original error; always chain or nest the root cause.
- Use language-specific propagation idioms: `?` in Rust, `throw` in TypeScript, `raise from` in Python.

```python
try:
    data = parse_config(path)
except toml.TOMLDecodeError as e:
    raise ConfigError(f"Invalid config at {path}") from e
```

## Logging Strategies

- Log errors at the point where they are handled, not where they are created.
- Use structured logging with key-value fields: `logger.error("msg", orderId=id, error=err)`.
- Set log levels appropriately: ERROR for failures, WARN for degraded states, INFO for key operations.
- Include correlation IDs (request ID, trace ID) in every log entry.
- Never log sensitive data: passwords, tokens, personal information.

## Fail-Fast vs Graceful Degradation

- Fail fast on programmer errors: invalid arguments, violated invariants, missing configuration.
- Degrade gracefully on environmental failures: network timeouts, unavailable dependencies.
- Validate all inputs at system boundaries and reject invalid data immediately.
- Define fallback behaviors explicitly: cached responses, default values, feature flags.

## Error Boundaries

- Establish error boundaries at architectural layers: API handlers, queue consumers, scheduled tasks.
- Catch and transform all errors at boundaries into appropriate responses.
- Never let internal error details leak to external clients; return sanitized messages.
- Map internal error types to HTTP status codes or protocol-specific error formats at the boundary.

```typescript
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(mapToHttpStatus(err.code)).json({ error: { code: err.code, message: err.message } });
  } else {
    res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
  }
});
```

## Retry Patterns

- Retry only on transient failures: network errors, 429/503 responses, connection resets.
- Never retry on client errors (4xx) or validation failures.
- Use exponential backoff with jitter to avoid thundering herd problems.
- Set a maximum retry count (typically 3) and make retried operations idempotent.

## General Guidelines

- Distinguish between expected errors (user input) and unexpected errors (bugs, system faults).
- Test error paths as thoroughly as success paths.
- Document the errors each function can produce in its API documentation.
