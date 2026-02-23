# Ruby

## Blocks, Procs, and Lambdas

- Use blocks (`do...end` for multi-line, `{...}` for single-line) for inline iteration and callbacks.
- Prefer lambdas over procs when strict argument checking is needed.
- Use `&method(:name)` to convert methods to blocks for cleaner iteration.
- Use `yield` for simple block delegation; use explicit `&block` parameter when storing or forwarding.

```ruby
names = users.map(&:name)
validator = ->(value) { value.present? && value.length <= 255 }
```

## Modules and Mixins

- Use modules to group related methods and share behavior across classes.
- Prefer `include` for instance methods and `extend` for class methods.
- Keep mixins focused: one behavior per module.

## Rails Conventions

- Follow MVC strictly: models hold business logic, controllers handle HTTP, views render output.
- Use RESTful routes and controller actions: `index`, `show`, `create`, `update`, `destroy`.
- Keep controllers thin; push complex logic into service objects or model methods.
- Use strong parameters for all user input; never trust raw `params`.

```ruby
class OrdersController < ApplicationController
  def create
    order = OrderService.new(current_user).create(order_params)
    render json: order, status: :created
  rescue OrderService::InvalidOrder => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def order_params
    params.require(:order).permit(:product_id, :quantity)
  end
end
```

## RSpec Testing Patterns

- Use `describe` for the class or method under test; use `context` for specific conditions.
- Start `context` descriptions with "when" or "with".
- Use `let` and `let!` for lazy and eager test data setup.
- Prefer `expect(subject).to` over `should` syntax.
- Use factories (FactoryBot) instead of fixtures for test data.

```ruby
RSpec.describe OrderService do
  describe "#create" do
    let(:user) { create(:user) }
    context "when params are valid" do
      it "creates an order" do
        order = described_class.new(user).create(product_id: 1, quantity: 2)
        expect(order).to be_persisted
      end
    end
  end
end
```

## Metaprogramming Guidelines

- Use metaprogramming sparingly and only when it provides clear value.
- Prefer `define_method` over `method_missing` for dynamic method generation.
- Always implement `respond_to_missing?` alongside `method_missing`.
- Document any dynamically generated methods in comments for discoverability.

## General Guidelines

- Use `frozen_string_literal: true` as the first line of every file.
- Prefer `Symbol` keys over string keys in hashes.
- Use guard clauses and early returns to reduce nesting.
- Run `rubocop` in CI with a project-specific configuration.
- Use `Enumerable` methods (`map`, `select`, `reject`, `reduce`) over manual loops.
