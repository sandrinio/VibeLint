# Java

## Generics

- Use bounded type parameters to enforce constraints: `<T extends Comparable<T>>`.
- Prefer wildcard types in method parameters: `List<? extends Number>` for flexibility.
- Avoid raw types; always parameterize generic classes and interfaces.
- Use `@SafeVarargs` on final or static methods that accept generic varargs.

```java
public static <T extends Comparable<T>> T max(List<? extends T> items) {
    return items.stream()
        .max(Comparator.naturalOrder())
        .orElseThrow(() -> new IllegalArgumentException("Empty list"));
}
```

## Streams API

- Use streams for declarative data transformations; prefer over manual loops for filter/map/reduce.
- Keep stream pipelines short and readable; extract complex operations into named methods.
- Use `Optional` terminal operations (`findFirst`, `reduce`) instead of null checks.
- Prefer `toList()` (Java 16+) over `collect(Collectors.toList())`.
- Avoid side effects inside stream operations; never mutate external state in `map` or `filter`.

## Spring Boot Conventions

- Follow the standard layering: Controller, Service, Repository.
- Use constructor injection exclusively; avoid field injection with `@Autowired`.
- Define configuration in `application.yml` with environment-specific profiles.
- Use `@RestControllerAdvice` for centralized exception handling.
- Keep controllers thin: validate input, delegate to services, return responses.

## Exception Hierarchy

- Create a base application exception that extends `RuntimeException`.
- Define specific exception subclasses for distinct failure modes.
- Include machine-readable error codes alongside human-readable messages.
- Never catch `Exception` or `Throwable` broadly; catch specific types.
- Use checked exceptions only when callers can meaningfully recover.

```java
public class OrderNotFoundException extends AppException {
    public OrderNotFoundException(String orderId) {
        super("ORDER_NOT_FOUND", "Order not found: " + orderId);
    }
}
```

## Optional Usage

- Return `Optional<T>` from methods that may not produce a result.
- Never pass `Optional` as a method parameter; use method overloading instead.
- Never call `get()` without `isPresent()`; prefer `orElseThrow`, `orElse`, or `map`.
- Do not use `Optional` for class fields; use nullable fields with clear documentation.

## Record Classes

- Use records for immutable data carriers: DTOs, value objects, configuration groups.
- Keep records simple; avoid adding mutable state or complex behavior.
- Use compact constructors for input validation.
- Override `toString` only when the default representation is insufficient.

## Sealed Interfaces

- Use sealed interfaces to define closed type hierarchies.
- Combine with pattern matching in `switch` expressions for exhaustive handling.
- Prefer sealed interfaces over enum types when variants carry different data.

## General Guidelines

- Use `var` for local variables only when the type is obvious from the right-hand side.
- Follow standard naming: `PascalCase` for classes, `camelCase` for methods, `UPPER_SNAKE` for constants.
- Use `final` on local variables and parameters to signal immutability intent.
- Write Javadoc on all public classes and methods.
- Configure `-Xlint:all` and treat warnings as errors in CI builds.
