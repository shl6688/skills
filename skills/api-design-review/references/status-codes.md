# HTTP Status Codes

Quick reference for the codes a typical JSON API needs, with the mistake that usually sits behind each one.

## Success

| Code | When | Notes |
| --- | --- | --- |
| 200 | Read, replace, or action with a body | Default for `GET` and `PUT` with a response body |
| 201 | Resource created | Include `Location: /v1/orders/{id}` |
| 202 | Accepted, processing async | Include how to poll the status |
| 204 | Success, no body | Deletes, `PUT` with nothing meaningful to return |

## Client errors

| Code | When | Common mistake |
| --- | --- | --- |
| 400 | Malformed request: bad JSON, missing required header, wrong type | Using 400 for validation failures |
| 401 | No credentials, or invalid or expired token | Returning 403 when the token is simply missing |
| 403 | Authenticated, not permitted | Using 403 to hide a 404 and then leaking it in the body |
| 404 | Resource does not exist, or caller must not know | Returning 404 for a malformed path |
| 405 | Method not allowed on this path | Emit the `Allow` header |
| 409 | State conflict: duplicate key, version mismatch, busy | Using 409 for validation errors |
| 412 | Precondition failed (`If-Match`) | Use with ETags for optimistic concurrency |
| 415 | Unsupported media type | Check `Content-Type` before parsing |
| 422 | Well-formed but semantically invalid | Field-level errors belong in `details` |
| 429 | Rate limited | Always pair with `Retry-After` |

## Server errors

| Code | When |
| --- | --- |
| 500 | Unhandled failure. Log with `request_id`, return the request id, nothing else |
| 502 | Upstream returned garbage or dropped the connection |
| 503 | Overloaded or in maintenance. Pair with `Retry-After` |
| 504 | Upstream timed out |

## Rules that save arguments

- Never return `200` with `{ "success": false }`. It breaks every generic client and hides the failure from monitoring.
- Pick one code per condition and use it everywhere, including in tests.
- The error body carries the detail; the status code carries the class.
- If a proxy can swallow a code (some do for 405 and 451), confirm in staging before relying on it.