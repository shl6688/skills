---
name: conventional-commits
description: Writes commit messages and changelog entries in Conventional Commits format from a staged diff, choosing type, scope, and breaking-change markers. Use when the user asks to commit, wants a commit message, or needs release notes generated from history.
license: MIT
metadata:
  version: 1.0.0
  tags: git, changelog, commits
---

# Conventional Commits

Turn a diff into a commit message that a changelog generator can parse.

## When to use

- The user asks for a commit message or says "commit this".
- Release notes need to be grouped by change type.
- A commit was rejected for a vague subject and needs rewriting.

## Workflow

1. Run `git diff --cached --stat` to see the staged shape. If nothing is staged, ask what should be included instead of committing everything.
2. Run `git diff --cached` and read it. The message must describe the actual change, not the branch name.
3. Pick one type:

   | Type | Use for |
   | --- | --- |
   | `feat` | New user-visible behavior |
   | `fix` | Wrong behavior corrected |
   | `perf` | Same behavior, measurable speed or memory gain |
   | `refactor` | Structure changed, no behavior change |
   | `docs` | Documentation only |
   | `test` | Tests only |
   | `build` | Build system, dependencies, packaging |
   | `ci` | Pipeline configuration |
   | `chore` | Maintenance that fits none of the above |
   | `revert` | Reverts a previous commit, reference its SHA |

4. Pick a scope: the module, package, or area touched, lowercase. Omit it when the change is repository-wide.
5. Write the subject: imperative mood, lowercase start, no trailing period, 50 characters or fewer. "add token refresh" not "added token refresh" or "adds".
6. Add a body only when the why is not obvious from the subject. Wrap at 72 characters, explain the problem and the tradeoff, not the code.
7. Mark breaking changes with `!` after the scope or type **and** a `BREAKING CHANGE:` footer that names the migration.

## Format

```text
<type>(<scope>)!: <subject>

<body>

<footer>
```

Example:

```text
feat(auth)!: require signed requests on ingest endpoints

The ingest path accepted unsigned payloads, so any caller could forge
events. Verification now happens before the body is parsed, which
rejects large payloads earlier than before.

BREAKING CHANGE: POST /v1/ingest without an X-Signature header now
returns 401. Clients must sign with the shared secret from the console.
```

## Changelog from history

```bash
git log --no-merges --format='%s%n%b---' v1.2.0..HEAD
```

Group by type in this order: breaking changes, `feat`, `fix`, `perf`, then the rest. Omit empty groups. Do not include `docs`, `test`, or `chore` in a user-facing changelog.

## Rules

- One commit, one type. If the staged diff contains a feature and an unrelated fix, split it first and say so.
- The subject describes the result, not the process. Not "update auth.go" but "reject expired tokens".
- Never write `chore: update` or `fix: bug`.
- Do not add trailers like `Co-authored-by` unless the user asks.
- If the diff mixes formatting and logic, mention the formatting churn in the body so reviewers can skip it.