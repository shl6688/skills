---
name: systematic-debugging
description: Diagnoses a bug by reproducing it, narrowing the failing component, forming a falsifiable hypothesis, and instrumenting before changing code, then locks the fix in with a regression test. Use when something is broken, a test fails intermittently, or a user reports behavior that cannot be reproduced yet.
license: MIT
version: 1.0.0
tags: debugging,testing,incident
---

# Systematic Debugging

Find the cause before touching the code. A fix applied to a symptom adds a second bug to the first.

## When to use

- A test fails, a service returns the wrong result, or the user reports something broken.
- A bug is intermittent, environment-specific, or has resisted a quick look.
- A previous fix did not hold, which means the cause was never found.

## Workflow

### 1. Reproduce

Get a failing case that runs in under a minute. Write down the exact command, input, and environment. If you cannot reproduce it, say so and collect the missing fact instead of guessing: version, config, data shape, timing.

A bug you cannot reproduce is a bug you cannot confirm fixed.

### 2. Locate the boundary

Bisect the path from input to wrong output. At each step check whether the data is still correct. Stop at the first place it is wrong; everything downstream is a consequence.

Useful boundaries, in order of cost:

- The request or function entry, with the real payload logged.
- The last successful call and the first failing one, when the flow is a chain.
- The commit range: `git bisect` when the bug appeared between two known-good tags.

### 3. Form one hypothesis

State it as a sentence that can be proven wrong: "The 500 comes from `parseQuery` rejecting an empty `tags` parameter, not from the database."

If the hypothesis survives contact with the evidence, it is not the answer yet. Confirm it by making the bug happen on purpose, or by making it disappear with a one-line change you can revert.

### 4. Instrument, do not patch

Add logging at the boundary, not inside every function. Log the inputs and outputs at the boundary, then remove the logging before the final diff.

Do not add a `try/catch`, a `sleep`, or a `null` check to make the symptom go away. Those are guesses with extra steps.

### 5. Fix the cause

Change the smallest thing that addresses the mechanism. If the fix requires touching five files, the diagnosis is probably incomplete.

### 6. Lock it in

Add a test that fails before the fix and passes after. Run it against the pre-fix code when practical. Name the test after the behavior, not the ticket number.

### 7. Report

State: symptom, cause, fix, how you verified, and what else could be affected. If the same cause can occur elsewhere, list where to look.

## Output format

```markdown
## Symptom
What was observed, with the exact reproduction command.

## Root cause
The mechanism, at the line that was wrong.

## Fix
What changed and why this addresses the cause.

## Verification
Test added, plus the command and result.

## Follow-ups
Related code with the same defect, or none.
```

## Rules

- Never report "fixed" without a reproduction that now passes.
- Intermittent bugs: gather evidence over several runs before naming a cause. Note the failure rate.
- A stack trace names the throw site, not necessarily the cause. Read up the call chain.
- If the bug is in a dependency, confirm with a minimal reproduction before filing upstream.
- When stuck for more than a couple of attempts, explain what you ruled out and ask for the missing fact. Guessing at random costs more than asking.