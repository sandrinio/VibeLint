# Python

## Type Hints

- Add type hints to every function signature, including return types.
- Use `from __future__ import annotations` for modern annotation syntax.
- Prefer `collections.abc` types (`Sequence`, `Mapping`) over concrete types in signatures.
- Use `TypeVar` and `Generic` for reusable typed abstractions.
- Run `mypy --strict` or `pyright` in CI to enforce type correctness.

```python
from collections.abc import Sequence

def find_user(users: Sequence[User], user_id: str) -> User | None:
    """Return the user with the given ID, or None if not found."""
    return next((u for u in users if u.id == user_id), None)
```

## PEP 8 Compliance

- Follow PEP 8 for all formatting: 4-space indentation, 79-character lines for code.
- Use a formatter such as `black` or `ruff format` with default settings.
- Run `ruff` or `flake8` as a linter in CI.
- Use `isort` or `ruff` to organize imports into standard library, third-party, and local groups.

## Docstrings

- Write Google-style docstrings for all public functions, classes, and modules.
- Include `Args`, `Returns`, and `Raises` sections when applicable.
- Keep the summary line under 80 characters and on a single line.

```python
def create_order(items: list[Item], discount: float = 0.0) -> Order:
    """Create a new order from the given items.

    Args:
        items: List of items to include in the order.
        discount: Percentage discount to apply, between 0.0 and 1.0.

    Returns:
        The newly created Order instance.

    Raises:
        ValueError: If items is empty or discount is out of range.
    """
```

## Virtual Environments

- Always use a virtual environment (`venv`, `uv`, or `poetry`) per project.
- Pin dependency versions in `requirements.txt` or `pyproject.toml`.
- Never install packages globally for project work.

## Context Managers

- Use `with` statements for all resource management: files, connections, locks.
- Implement `__enter__` and `__exit__` or use `contextlib.contextmanager` for custom resources.
- Never rely on garbage collection to close resources.

## Comprehensions and Iteration

- Prefer list comprehensions over `map`/`filter` with lambdas for simple transforms.
- Use generator expressions for large datasets to avoid loading everything into memory.
- Switch to explicit loops when logic requires multiple statements or complex conditions.
- Use `enumerate` instead of manual index tracking; use `zip` to iterate in parallel.

## File and Path Handling

- Use `pathlib.Path` instead of `os.path` for all file path operations.
- Use `Path.read_text()` and `Path.write_text()` for simple file I/O.
- Construct paths with `/` operator: `base_dir / "subdir" / "file.txt"`.

## General Guidelines

- Use dataclasses or Pydantic models instead of plain dicts for structured data.
- Prefer `logging` over `print` for all output in library and application code.
- Use f-strings for string formatting; avoid `%` formatting and `.format()`.
- Raise specific exceptions; never use bare `raise Exception(...)`.
- Write `if __name__ == "__main__":` guards in executable scripts.
