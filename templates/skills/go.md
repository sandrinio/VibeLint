# Go

## Error Handling

- Always check returned errors immediately; never discard with `_`.
- Wrap errors with context using `fmt.Errorf("operation failed: %w", err)`.
- Define sentinel errors with `errors.New` for expected failure conditions.
- Use `errors.Is` and `errors.As` for error comparison; never compare error strings.
- Return errors rather than panicking; reserve `panic` for truly unrecoverable states.

```go
func loadConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("loadConfig %q: %w", path, err)
    }
    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return nil, fmt.Errorf("loadConfig parse: %w", err)
    }
    return &cfg, nil
}
```

## Goroutines and Channels

- Always ensure goroutines can exit; use `context.Context` for cancellation.
- Prefer channels for communication and sync primitives for shared state.
- Use `sync.WaitGroup` to wait for a known number of goroutines to complete.

## Interfaces

- Keep interfaces small: one or two methods is ideal.
- Define interfaces where they are consumed, not where they are implemented.
- Accept interfaces, return concrete structs.
- Do not create interfaces preemptively; extract them when a second implementation is needed.

```go
// Defined in the consumer package
type Store interface {
    Get(ctx context.Context, key string) ([]byte, error)
}
```

## Package Design

- Keep package names short, lowercase, and singular: `user`, `http`, `config`.
- Avoid `util` or `common` packages; place functions with the types they operate on.
- Minimize exported symbols; start with unexported and promote only when needed.
- Use `internal/` directories to prevent external imports of implementation details.

## Table-Driven Tests

- Use table-driven tests for functions with multiple input/output scenarios.
- Use `t.Run` with descriptive names for readable output and selective test running.

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name           string
        a, b, expected int
    }{
        {"positive", 2, 3, 5},
        {"zero", 0, 0, 0},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            if got := Add(tt.a, tt.b); got != tt.expected {
                t.Errorf("Add(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.expected)
            }
        })
    }
}
```

## General Guidelines

- Use `gofmt` or `goimports` on every file; never commit unformatted Go code.
- Prefer `context.Context` as the first parameter for functions involving I/O.
- Use struct embedding for composition, not inheritance.
- Avoid `init()` functions; prefer explicit initialization in `main`.