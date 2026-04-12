---
trigger: always_on
---

# Coding Standards

## Language
- All code, comments, variable names, function names, and documentation must be written in **English**
- Exception: user-facing UI strings may be in Spanish if the product requires it

## Clean Code
- Functions must do ONE thing only — if you need "and" to describe it, split it
- Max function length: 30 lines. If longer, extract
- Max file length: 200 lines. If longer, split by responsibility
- Max parameters: 3. Beyond that, use a config object or builder pattern
- No magic numbers or strings — use named constants
- Avoid deep nesting (max 3 levels). Use early returns and guard clauses
- No commented-out code — use git for history
- No dead code — remove unused functions, imports, variables

## SOLID Principles
- **Single Responsibility**: each module/class/function has one reason to change
- **Open/Closed**: extend behavior via composition, not by modifying existing code
- **Liskov Substitution**: subtypes must be substitutable for their base types
- **Interface Segregation**: small, focused interfaces over large general ones
- **Dependency Inversion**: depend on abstractions, not concretions — inject dependencies

## Clean Architecture
- Strict layer separation: domain → application → infrastructure → presentation
- Domain layer has zero external dependencies (no Next.js, no Drizzle, no HTTP)
- Business logic never lives in components or route handlers
- Data access only through repository interfaces — never query the DB from a component
- Server Actions are thin: validate input → call service → return result

## DRY & Abstraction
- Never duplicate logic — extract to shared utilities or hooks
- If you write the same code twice, abstract it on the third occurrence
- Prefer composition over inheritance
- Shared logic goes in `lib/` or `utils/` — not inlined in components

## TypeScript
- Strict mode always — no `any` without explicit justification in a comment
- Prefer `type` over `interface` for data shapes, `interface` for contracts
- Always type function return values explicitly
- Use `unknown` instead of `any` for truly unknown values, then narrow with guards
- Avoid type assertions (`as`) — fix the types instead

## Concurrency & Simultaneity
- Assume all operations run concurrently — never rely on execution order across requests
- Use optimistic locking or versioning for entities that multiple users can modify
- Database mutations that affect multiple rows must use transactions
- Avoid shared mutable state — prefer immutable data structures
- Server Actions must be idempotent where possible
- Use `Promise.all` for independent async operations — never `await` sequentially when parallel is possible
- Always handle race conditions in forms (disable submit while pending, use `useTransition`)

## Responsive Design
- Mobile-first by default — base styles for mobile, then `md:` and `lg:` breakpoints
- Never use fixed pixel widths for layout containers
- Touch targets minimum 44x44px
- Test layouts at 375px, 768px, and 1280px breakpoints
- Use Tailwind responsive prefixes consistently — no mixed inline styles

## Error Handling
- Never swallow errors silently — log or surface them
- User-facing errors must be human-readable, never raw stack traces
- Always handle the unhappy path before the happy path
- Server Actions must return typed results `{ success, data?, error? }` — never throw to the client

## What to Avoid
- God objects/components that know too much
- Prop drilling more than 2 levels — use context or state management
- `useEffect` for data fetching — use Server Components or React Query
- Premature optimization — profile first, then optimize
- Overly clever code — prefer obvious over smart