# C#

## Async/Await with Task

- Use `async`/`await` for all I/O-bound operations; never block with `.Result` or `.Wait()`.
- Return `Task` or `Task<T>` from async methods; return `ValueTask<T>` for hot-path methods that often complete synchronously.
- Suffix async method names with `Async`: `GetUserAsync`, `SaveOrderAsync`.
- Always pass and honor `CancellationToken` in async method signatures.
- Use `ConfigureAwait(false)` in library code to avoid capturing the synchronization context.

```csharp
public async Task<User> GetUserAsync(string id, CancellationToken ct = default)
{
    var response = await _httpClient.GetAsync($"/users/{id}", ct)
        .ConfigureAwait(false);
    response.EnsureSuccessStatusCode();
    return await response.Content.ReadFromJsonAsync<User>(ct)
        .ConfigureAwait(false);
}
```

## LINQ Queries

- Prefer method syntax (`Where`, `Select`, `OrderBy`) over query syntax for consistency.
- Use `Any()` instead of `Count() > 0` for existence checks.
- Avoid multiple enumeration of `IEnumerable`; materialize with `ToList()` when reused.
- Keep LINQ chains readable by placing each operation on its own line.
- Use `Chunk` (C# 12+) for batching and `DistinctBy` for deduplication.

## Nullable Reference Types

- Enable nullable reference types project-wide: `<Nullable>enable</Nullable>`.
- Annotate nullable parameters and return types with `?` explicitly.
- Use the null-forgiving operator `!` only when nullability has been verified by logic the compiler cannot see.
- Prefer pattern matching for null checks: `if (user is { Name: var name })`.

## Dependency Injection

- Use constructor injection for all required dependencies.
- Register services with the appropriate lifetime: `Singleton`, `Scoped`, or `Transient`.
- Define service interfaces in the domain layer; implement them in the infrastructure layer.
- Avoid service locator patterns; never resolve services manually from `IServiceProvider` in business logic.

```csharp
public class OrderService(IOrderRepository repo, ILogger<OrderService> logger)
{
    public async Task<Order> CreateAsync(OrderRequest request, CancellationToken ct)
    {
        logger.LogInformation("Creating order for {Customer}", request.CustomerId);
        var order = Order.From(request);
        await repo.SaveAsync(order, ct);
        return order;
    }
}
```

## Record Types

- Use `record` for immutable value objects and DTOs.
- Use `record struct` for small, stack-allocated value types.
- Leverage `with` expressions for non-destructive mutation.
- Use positional records for concise definitions of simple data carriers.

## Pattern Matching

- Use `switch` expressions with pattern matching for multi-branch logic.
- Combine type patterns, property patterns, and relational patterns for clarity.
- Always include a discard `_` arm or throw in switch expressions to handle unexpected cases.
- Prefer `is` patterns over explicit type casts for type checks.

## General Guidelines

- Follow .NET naming conventions: `PascalCase` for public members, `_camelCase` for private fields.
- Use `nameof()` for property and parameter name references.
- Prefer `IReadOnlyList<T>` and `IReadOnlyDictionary<K,V>` in public signatures.
- Use `Span<T>` and `Memory<T>` for performance-sensitive buffer operations.
- Enable and resolve all compiler warnings; treat warnings as errors in CI.
