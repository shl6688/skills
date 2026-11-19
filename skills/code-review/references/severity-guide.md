# Severity Guide

Use this table when deciding between major and minor, and when deciding whether a finding is worth reporting at all.

## blocker

- The code computes the wrong value under a condition the tests do not cover.
- A write path can lose or corrupt data: missing transaction, unhandled partial failure, delete without a where clause.
- Injection, authentication bypass, authorization missing on a new endpoint, secrets committed in plain text.
- The build or type check fails, or a migration is required and absent.
- A public API contract changes without a version bump.

## major

- An error is caught and discarded, so the failure surfaces later with less context.
- A retry loop has no backoff or no cap.
- Concurrency: shared state mutated without a lock, or a lock held across a network call.
- Pagination, sorting, or filtering added without an index or a bound.
- A new dependency is pinned to a floating range for a security-sensitive package.
- A behavior change breaks an existing test that was deleted or skipped in the same diff.

## minor

- Two functions do the same thing; one is dead code.
- A parameter list grew past four positional arguments.
- Naming that misleads: `userId` holds an email, `count` is a bool.
- Logging added at the wrong level (debug for a failure).

## nit

- Formatting, import order, comment typos.
- Style preferences the project linter does not enforce.

## Not a finding

- Personal preference the project has no rule about.
- A rewrite the reviewer would have done differently but that is correct.
- Missing docstrings on code the diff did not touch.
- "Consider extracting a helper" for a five-line block used once.

When in doubt between two levels, pick the lower one and say why in one clause.