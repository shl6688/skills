---
name: code-review
description: Reviews a git diff or pull request for correctness, security, and maintainability, and returns findings ordered by severity with path:line references and concrete fixes. Use when the user asks to review code, check a PR, or wants a merge decision.
license: MIT
version: 1.0.0
tags: review,git,pull-request
---

# Code Review

Review the change, not the whole repository. Read the diff first, then open only the files and call sites needed to judge it.

## When to use

- The user asks for a review of uncommitted work, a branch, or a pull request.
- A merge decision is needed before release.
- Someone pastes a patch and asks whether it is correct.

Do not use this skill to rewrite the change. If the fix is small and the user asked for one, apply it and say what changed.

## Workflow

1. **Get the shape of the change.** Run `git diff --stat` and read the commit messages or PR description. Know the intent before judging the code.
2. **Read the diff.** `git diff` for unstaged work, `git diff --cached` for staged, `git diff main...HEAD` for a branch. Note files that changed for no visible reason.
3. **Read the context.** For every changed function, check: who calls it, what happens on the error path, and whether an existing test already covers the branch you care about.
4. **Classify.** Each finding gets exactly one severity:

   | Severity | Meaning |
   | --- | --- |
   | blocker | Wrong result, data loss, security hole, broken build, or missing migration |
   | major | Missed edge case, swallowed error, race condition, unbounded resource growth |
   | minor | Naming, duplication, awkward structure that still works |
   | nit | Style the formatter would not fix; safe to ignore |

   See [references/severity-guide.md](references/severity-guide.md) when the line between major and minor is unclear.
5. **Write the report.** Every finding needs a `path:line`, what breaks, and the smallest fix. If nothing is wrong, say so and list what you checked.

## Output format

````markdown
## Summary
One paragraph: what the change does, whether it is safe to merge as-is.

## Findings
### [blocker] internal/auth/token.go:88 — Expired tokens pass validation
`exp` is compared with `>=` instead of `>`, so a token is accepted for one extra second.
Fix: use `time.Now().After(exp)` and add a test with a token expiring exactly now.

## Questions
Anything you could not verify from the diff alone.
````

Order findings by severity, then by file path. Use no severity heading at all if there is nothing to report; do not pad with "looks good" placeholders.

## Rules

- Never report a finding you cannot point at. "This might be a problem" without a line number is noise.
- Do not restate the diff. The author already knows what they wrote.
- Reject changes outside the diff only when the diff breaks them.
- Run the tests if the repository is runnable. Report the exact command and the result, including failures unrelated to the change.
- Hard-coded secrets, credentials, or personal data are blockers regardless of context. Do not repeat the secret in the report; reference the line.
- Missing tests are a finding only when the change touches money, auth, data deletion, or concurrency.
- Do not approve to be agreeable. "Ship it" means you checked the error paths.