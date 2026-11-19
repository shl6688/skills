---
name: api-design-review
description: Reviews HTTP API surface design against a checklist covering resources, methods, status codes, pagination, error models, idempotency, and versioning, and returns concrete corrections. Use when designing new endpoints, reviewing an OpenAPI spec, or fixing inconsistent API behavior.
license: MIT
metadata:
  version: 1.0.0
  tags: api, rest, http, openapi
---

# API Design Review

Judge the interface, not the implementation. The question is whether a client can use it correctly without reading the server code.

## Workflow

1. Collect the surface: routes, request and response bodies, status codes, auth requirements. If the input is an OpenAPI file, list the operations first.
2. Walk the checklist below top to bottom. Record only violations, with the operation named.
3. Rank each issue as **breaking** (existing clients must change), **inconsistent** (works but differs from the rest of the API), or **cosmetic**.
4. For each issue give the current shape and the corrected shape.
5. If the API is new, state the three decisions a client cares about first: auth model, pagination model, error model.

## Checklist

### Resources and naming

- Paths are nouns, plural, lowercase, hyphenated: `/v1/order-items`, not `/v1/getOrderItem`.
- No verbs in the path. Actions that do not map to CRUD become a sub-resource: `POST /v1/orders/{id}/cancel`.
- IDs are opaque strings. Do not leak sequential integers where enumeration matters.
- Nesting stops at two levels. Deeper relations become query filters.

### Methods and status codes

- `GET` is safe and idempotent. `PUT` is idempotent. `POST` is neither unless documented.
- Single-resource reads return the resource; collections return an object with `items` and pagination metadata, never a bare array.
- Creation returns `201` with a `Location` header. `204` for deletes and for updates with no body.
- `400` for malformed syntax, `422` for well-formed but invalid semantics. Do not use `400` for both.
- `401` for missing or bad credentials, `403` for authenticated but not allowed. Do not leak resource existence in a `403`.
- `409` for state conflicts, `429` for rate limits with `Retry-After`.
- `404` from a nested path means the parent is wrong; distinguish it in the error payload when clients can act on it.

Details per code in [references/status-codes.md](references/status-codes.md).

### Requests and responses

- Field names are `snake_case` or `camelCase`, consistently, including nested objects.
- Timestamps are RFC 3339 in UTC with an offset. Durations carry a unit in the field name (`timeout_ms`, not `timeout`).
- Enums are strings, not integers. Unknown enum values must not crash the client.
- No `null` where an empty collection or an omitted field would do; clients handle absent keys more reliably than `null`.
- Responses include only what the caller needs. Separate the list view from the detail view when the detail object is large.

### Pagination

- Pick one: cursor-based for feeds and large tables, offset for small bounded sets. Do not mix.
- Cursor responses include `next_cursor` and a `has_more` boolean. Never derive `has_more` from `len(items) == page_size`.
- Document the default and maximum page size, and enforce the maximum server-side.

### Errors

- One envelope for every error: `{ "error": { "code", "message", "details", "request_id" } }`.
- `code` is a stable machine string (`order_not_found`), `message` is for humans, `details` holds field-level errors.
- Validation errors list every bad field, not just the first.
- Never return stack traces, SQL, or internal hostnames, in any environment.

### Idempotency and safety

- `POST` endpoints that create money-moving or non-repeatable resources accept an `Idempotency-Key` header and replay the original response.
- Deletes are soft when the data matters; document the retention window.
- State-changing `GET` calls are a bug regardless of how convenient they are.

### Versioning and evolution

- Major version in the path (`/v1`) or in a header, not both.
- Adding optional fields is non-breaking. Removing a field, changing a type, tightening validation, or changing a default is breaking.
- Deprecation ships with a `Sunset` header and a written migration note before removal.

## Output format

````markdown
## Summary
What the API does, and the three decisions clients care about.

## Issues
### [breaking] POST /v1/orders/{id}/cancel conflicts with DELETE /v1/orders/{id}
Two ways to cancel; clients will pick differently and audit logs will disagree.
Use one: `DELETE /v1/orders/{id}` returning 202 while cancellation is pending.

## Suggested surface
A compact route table for the corrected design.
````

## Rules

- Do not invent endpoints the user did not ask for; propose the smallest surface that supports the stated use case.
- Consistency beats local elegance: match the existing API even when another convention is nicer, then note the inconsistency once.
- Performance is part of design: name the query each list endpoint implies and the index it needs.