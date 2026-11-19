#!/usr/bin/env node
/**
 * Validate every skill under skills/.
 *
 * Checks the frontmatter contract, the directory/name pairing, and that
 * relative links inside SKILL.md point at files that exist.
 *
 * Usage: node scripts/validate-skills.mjs [skills-dir]
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const skillsDir = resolve(process.argv[2] ?? join(repoRoot, 'skills'));

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_KEYS = new Set(['name', 'description', 'license', 'version', 'tags']);
const MAX_NAME = 64;
const MIN_DESC = 20;
const MAX_DESC = 1024;

const errors = [];
const warnings = [];
let checked = 0;

function fail(file, message) {
  errors.push(`${relative(repoRoot, file)}: ${message}`);
}

function warn(file, message) {
  warnings.push(`${relative(repoRoot, file)}: ${message}`);
}

function parseFrontmatter(file, text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    fail(file, 'file must start with a "---" frontmatter block');
    return null;
  }

  const close = normalized.indexOf('\n---', 3);
  if (close === -1) {
    fail(file, 'frontmatter is not closed with a "---" line');
    return null;
  }

  const fields = {};
  for (const line of normalized.slice(4, close).split('\n')) {
    if (line.trim() === '') continue;
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      fail(file, `frontmatter line is not "key: value": ${line.trim()}`);
      return null;
    }
    const key = match[1];
    let value = match[2].trim();
    if (key in fields) {
      fail(file, `duplicate frontmatter key: ${key}`);
      return null;
    }
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    fields[key] = value;
  }

  const body = normalized.slice(close + 4).replace(/^\n+/, '');
  return { fields, body };
}

function checkSkill(dirName) {
  const skillDir = join(skillsDir, dirName);
  const file = join(skillDir, 'SKILL.md');
  checked += 1;

  if (!existsSync(file)) {
    fail(skillDir, 'missing SKILL.md');
    return;
  }

  const parsed = parseFrontmatter(file, readFileSync(file, 'utf8'));
  if (!parsed) return;
  const { fields, body } = parsed;

  for (const key of Object.keys(fields)) {
    if (!ALLOWED_KEYS.has(key)) fail(file, `unknown frontmatter key: ${key}`);
  }

  const name = fields.name;
  if (!name) {
    fail(file, 'missing "name"');
  } else {
    if (!NAME_RE.test(name)) {
      fail(file, `"name" must be lowercase letters, digits and single hyphens: ${name}`);
    }
    if (name.length > MAX_NAME) fail(file, `"name" is ${name.length} characters, max ${MAX_NAME}`);
    if (name !== dirName) fail(file, `"name" (${name}) must equal the directory name (${dirName})`);
  }

  const desc = fields.description;
  if (!desc) {
    fail(file, 'missing "description"');
  } else if (desc.length < MIN_DESC) {
    fail(file, `"description" is ${desc.length} characters, needs at least ${MIN_DESC}`);
  } else if (desc.length > MAX_DESC) {
    fail(file, `"description" is ${desc.length} characters, max ${MAX_DESC}`);
  }

  if (fields.version && !/^\d+\.\d+\.\d+$/.test(fields.version)) {
    fail(file, `"version" must be semver (x.y.z): ${fields.version}`);
  }

  if (body.trim().length < 200) {
    warn(file, `body is only ${body.trim().length} characters, likely too thin to follow`);
  }
  if (!/^##\s+/m.test(body)) {
    warn(file, 'body has no "##" section heading');
  }

  const links = [...body.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
  for (const link of links) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('#')) continue;
    const target = link.split('#')[0];
    if (!existsSync(join(skillDir, target))) {
      fail(file, `linked file does not exist: ${link}`);
    }
  }
}

if (!existsSync(skillsDir)) {
  console.error(`error: skills directory not found: ${skillsDir}`);
  process.exit(1);
}

for (const entry of readdirSync(skillsDir).sort()) {
  if (entry.startsWith('.') || entry.startsWith('_')) continue;
  if (!statSync(join(skillsDir, entry)).isDirectory()) continue;
  checkSkill(entry);
}

for (const line of warnings) console.warn(`warn  ${line}`);
for (const line of errors) console.error(`error ${line}`);

const summary = `checked ${checked} skill${checked === 1 ? '' : 's'}: ${errors.length} error(s), ${warnings.length} warning(s)`;
if (errors.length > 0) {
  console.error(summary);
  process.exit(1);
}
console.log(summary);