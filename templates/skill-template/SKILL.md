---
name: skill-template
description: Template for a new skill. Replace this line with one single-line description of what the skill does and when it should be triggered, then rename the directory and the name field to match.
license: MIT
version: 1.0.0
tags: template
---

# Skill Title

One paragraph: what this skill handles, and what it deliberately does not do.

## When to use

- Trigger conditions, written as observable situations, not vague categories.
- A case that looks similar but should not trigger this skill.

## Workflow

1. First step, with an explicit output.
2. Second step.
3. Third step.

Put long checklists in `references/<topic>.md` and link them: [checklist](references/checklist.md).

## Output format

````markdown
## Section
The shape the user should get back.
````

## Rules

- Hard constraints, stated as rules that can be checked.
- Things the model must not do.
- How to handle missing information: say what is missing and continue with the rest.

## Checklist

- [ ] Directory name equals `name`
- [ ] `description` is one line, 20 to 1024 characters
- [ ] Steps are executable
- [ ] Referenced files exist
- [ ] `node scripts/validate-skills.mjs` passes