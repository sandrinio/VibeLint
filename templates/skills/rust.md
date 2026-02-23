# Rust

## Ownership and Borrowing

- Pass data by reference (`&T` or `&mut T`) unless the function needs to take ownership.
- Prefer borrowing over cloning; use `.clone()` only when shared ownership is truly required.
- Move values into closures and threads explicitly; use `move` closures when spawning tasks.
- Structure data to minimize lifetimes: prefer owned types in structs stored long-term.

## Lifetime Annotations

- Rely on lifetime elision rules for simple function signatures; annotate only when the compiler requires it.
- Name lifetimes descriptively when a function has multiple: `'input`, `'output` rather than `'a`, `'b`.
- Prefer `'_` for anonymous lifetimes in impl blocks where the lifetime is unambiguous.
- Avoid `'static` bounds unless the data genuinely lives for the entire program duration.

```rust
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}
```

## Result and Option Patterns

- Use `Result<T, E>` for operations that can fail; use `Option<T>` for optional values.
- Chain operations with `map`, `and_then`, `unwrap_or_else` instead of manual matching.
- Use the `?` operator for early error propagation in functions returning `Result` or `Option`.
- Never call `.unwrap()` in library or production code; use `.expect("reason")` only in tests or provably safe cases.

```rust
fn read_config(path: &Path) -> Result<Config, AppError> {
    let contents = fs::read_to_string(path)
        .map_err(|e| AppError::Io { path: path.into(), source: e })?;
    let config: Config = toml::from_str(&contents)
        .map_err(|e| AppError::Parse { source: e })?;
    Ok(config)
}
```

## Trait Design

- Keep traits focused: one primary behavior per trait.
- Provide default method implementations where a sensible default exists.
- Use trait objects (`dyn Trait`) for runtime polymorphism; use generics (`impl Trait`) for static dispatch.
- Prefer `impl Trait` in argument position to simplify function signatures.
- Seal traits (using a private supertrait) when external implementations should not be allowed.

## Derive Macros

- Derive `Debug` on all types; derive `Clone`, `PartialEq`, and `Eq` when meaningful.
- Use `#[derive(Default)]` for types with sensible zero-value defaults.
- Prefer derive macros from `serde` (`Serialize`, `Deserialize`) for serialization.
- Order derive attributes consistently: `Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize`.

## Error Handling

- Use `thiserror` for library error types with structured variants.
- Use `anyhow` for application-level code where error context matters more than type.
- Define an error enum per crate or module with `#[error(...)]` and `#[from]` attributes.
- Include contextual data in error variants: file paths, IDs, or operation names.

## General Guidelines

- Run `cargo clippy` with warnings denied in CI: `cargo clippy -- -D warnings`.
- Format all code with `cargo fmt` before committing.
- Prefer iterators over indexed loops; use `iter()`, `into_iter()`, or `iter_mut()` explicitly.
- Use `const` and `static` appropriately; prefer `const` for compile-time values.
- Use modules and visibility (`pub`, `pub(crate)`) to control API surface carefully.
