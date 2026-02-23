# Testing

## Unit vs Integration Testing

- Write unit tests for individual functions and classes in isolation.
- Write integration tests for interactions between components, databases, and external services.
- Maintain a ratio of roughly 70% unit, 20% integration, 10% end-to-end tests.
- Keep unit tests fast (under 100ms each) by avoiding I/O and external dependencies.
- Run unit tests on every commit; run integration tests in CI before merge.

## AAA Pattern (Arrange-Act-Assert)

- Structure every test into three distinct sections: Arrange, Act, Assert.
- Separate each section with a blank line for readability.
- Keep the Act section to a single function call or operation.

```python
def test_apply_discount_reduces_total():
    # Arrange
    order = Order(items=[Item("Widget", price=100)])

    # Act
    discounted = apply_discount(order, percent=10)

    # Assert
    assert discounted.total == 90
```

## Mocking Guidelines

- Mock external dependencies (APIs, databases, file systems) in unit tests.
- Never mock the system under test; mock only its collaborators.
- Prefer fakes and stubs over mocks when behavior verification is not needed.
- Keep mock setup minimal; complex mock configurations signal a design problem.

```typescript
const mockRepo = { findById: jest.fn().mockResolvedValue({ id: "1", name: "Alice" }) };
const service = new UserService(mockRepo);
expect((await service.getUser("1")).name).toBe("Alice");
```

## Test Naming Conventions

- Name tests to describe the scenario and expected outcome.
- Use the pattern: `[unit]_[scenario]_[expectedResult]` or natural language descriptions.
- Make test names readable as documentation.
- Be specific: `"returns empty list when no orders exist"` not `"test getOrders"`.

## Coverage Targets

- Aim for 80% line coverage as a minimum baseline.
- Focus coverage on business logic and error handling paths, not boilerplate.
- Do not chase 100% coverage; diminishing returns set in above 90%.
- Measure branch coverage in addition to line coverage for conditional logic.

## Test Isolation

- Each test must be independent; never rely on execution order.
- Reset shared state (databases, caches, global variables) between tests.
- Use fresh instances of dependencies for each test case.
- Run tests in parallel by default; fix tests that fail under parallelism.

## Fixture Management

- Use factory functions or builder patterns to create test data.
- Define minimal fixtures: only set the fields relevant to each test.
- Share fixture setup through helper functions, not test inheritance.

```typescript
function buildUser(overrides: Partial<User> = {}): User {
  return { id: "test-id", name: "Test User", email: "test@example.com", ...overrides };
}
```

## General Guidelines

- Treat test code with the same quality standards as production code.
- Delete obsolete tests; do not leave skipped or commented-out tests in the suite.
- Test edge cases: empty inputs, boundary values, null/undefined, large datasets.
- Run the full test suite before merging and keep it consistently green.
