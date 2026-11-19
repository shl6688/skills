#!/usr/bin/env node
/**
 * Validate every skill under skills/ against the Agent Skills specification
 * (https://agentskills.io/specification) and check the optional Claude Code
 * plugin manifests in .claude-plugin/.
 *
 * Usage: node scripts/validate-skills.mjs [skills-dir]
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const skillsDir = resolve(process.argv[2] ?? join(repoRoot, 'skills'));
const isDefaultRun = skillsDir === join(repoRoot, 'skills');

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SPEC_KEYS = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
const MAX_NAME = 64;
const MIN_DESC = 20;
const MAX_DESC = 1024;
const MAX_COMPAT = 500;

const errors = [];
const warnings = [];
let checked = 0;

const fail = (file, message) => errors.push(`${relative(repoRoot, file)}: ${message}`);
const warn = (file, message) => warnings.push(`${relative(repoRoot, file)}: ${message}`);

function unquote(value) {
  return /^(['"]).*\1$/.test(value) ? value.slice(1, -1) : value;
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
  let open = null;

  for (const line of normalized.slice(4, close).split('\n')) {
    if (line.trim() === '') continue;

    const top = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (top && !/^\s/.test(line)) {
      const [, key, rawValue] = top;
      if (key in fields) {
        fail(file, `duplicate frontmatter key: ${key}`);
        return null;
      }
      if (rawValue === '') {
        fields[key] = {};
        open = key;
      } else {
        fields[key] = unquote(rawValue.trim());
        open = null;
      }
      continue;
    }

    const nested = /^\s+([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (nested && open === 'metadata') {
      const [, key, rawValue] = nested;
      if (rawValue === '') {
        fail(file, `metadata.${key} must be a string, not a nested map`);
        return null;
      }
      const value = unquote(rawValue.trim());
      if (!/^(['"]).*\1$/.test(rawValue.trim()) && value === '') {
        fail(file, `metadata.${key} is empty`);
      }
      fields.metadata[key] = value;
      continue;
    }

    fail(file, `frontmatter line is neither "key: value" nor a metadata entry: ${line.trim()}`);
    return null;
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
    if (!SPEC_KEYS.has(key)) {
      fail(file, `frontmatter key "${key}" is not in the Agent Skills spec (name, description, license, compatibility, metadata, allowed-tools)`);
    }
  }

  const name = fields.name;
  if (!name || typeof name !== 'string') {
    fail(file, 'missing "name"');
  } else {
    if (!NAME_RE.test(name)) {
      fail(file, `"name" must be lowercase letters, digits and single hyphens, no leading or trailing hyphen: ${name}`);
    }
    if (name.length > MAX_NAME) fail(file, `"name" is ${name.length} characters, max ${MAX_NAME}`);
    if (name !== dirName) fail(file, `"name" (${name}) must equal the directory name (${dirName})`);
  }

  const desc = fields.description;
  if (!desc || typeof desc !== 'string') {
    fail(file, 'missing "description"');
  } else if (desc.length < MIN_DESC) {
    fail(file, `"description" is ${desc.length} characters, needs at least ${MIN_DESC}`);
  } else if (desc.length > MAX_DESC) {
    fail(file, `"description" is ${desc.length} characters, max ${MAX_DESC}`);
  }

  const compat = fields.compatibility;
  if (typeof compat === 'string' && compat.length > MAX_COMPAT) {
    fail(file, `"compatibility" is ${compat.length} characters, max ${MAX_COMPAT}`);
  }

  if (fields.metadata && typeof fields.metadata === 'object') {
    for (const [key, value] of Object.entries(fields.metadata)) {
      if (typeof value !== 'string') fail(file, `metadata.${key} must be a string`);
    }
    const version = fields.metadata.version;
    if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
      fail(file, `metadata.version must be semver (x.y.z): ${version}`);
    }
  }

  if (body.trim().length < 200) {
    warn(file, `body is only ${body.trim().length} characters, likely too thin to follow`);
  }
  if (!/^##\s+/m.test(body)) {
    warn(file, 'body has no "##" section heading');
  }

  for (const match of body.matchAll(/\]\(([^)\s]+)\)/g)) {
    const link = match[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('#')) continue;
    const target = link.split('#')[0];
    if (!existsSync(join(skillDir, target))) {
      fail(file, `linked file does not exist: ${link}`);
    }
  }
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    fail(file, `invalid JSON: ${error.message}`);
    return null;
  }
}

function checkPluginManifests() {
  const pluginDir = join(repoRoot, '.claude-plugin');
  const manifestFile = join(pluginDir, 'plugin.json');
  const marketplaceFile = join(pluginDir, 'marketplace.json');

  if (!existsSync(manifestFile) && !existsSync(marketplaceFile)) return;

  let pluginName = null;
  if (existsSync(manifestFile)) {
    const manifest = readJson(manifestFile);
    if (manifest) {
      if (!manifest.name || typeof manifest.name !== 'string') {
        fail(manifestFile, 'missing "name"');
      } else {
        pluginName = manifest.name;
        if (/\s|@|:|\/|\\/.test(pluginName)) fail(manifestFile, `"name" must be kebab-case: ${pluginName}`);
      }
      if (!manifest.version) warn(manifestFile, 'no "version"; Claude Code will not pin an installed copy');
      if (!manifest.description) warn(manifestFile, 'no "description"');
      if (!manifest.author?.name) warn(manifestFile, 'no "author.name"');
      if (manifest.license && !/^[A-Za-z0-9.+-]+$/.test(manifest.license)) {
        fail(manifestFile, `"license" should be an SPDX identifier: ${manifest.license}`);
      }
      for (const dir of [].concat(manifest.skills ?? [])) {
        if (dir === '.' || dir === './') continue;
        if (!dir.startsWith('./')) {
          fail(manifestFile, `"skills" path must start with "./": ${dir}`);
        } else if (!existsSync(join(repoRoot, dir))) {
          fail(manifestFile, `"skills" path does not exist: ${dir}`);
        }
      }
    }
  }

  if (!existsSync(marketplaceFile)) {
    if (pluginName) warn(marketplaceFile, 'plugin.json present without a marketplace.json, so the repo cannot be added as a marketplace');
    return;
  }

  const marketplace = readJson(marketplaceFile);
  if (!marketplace) return;

  if (!marketplace.name || typeof marketplace.name !== 'string') {
    fail(marketplaceFile, 'missing "name"');
  } else if (/^(claude|anthropic|anthropics|claude-code|claude-mods)$/i.test(marketplace.name)) {
    fail(marketplaceFile, `marketplace name "${marketplace.name}" is reserved for Anthropic`);
  }
  if (!marketplace.owner?.name) fail(marketplaceFile, 'missing "owner.name"');
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    fail(marketplaceFile, '"plugins" must be a non-empty array');
    return;
  }

  for (const [index, entry] of marketplace.plugins.entries()) {
    const label = `plugins[${index}]`;
    if (!entry?.name || typeof entry.name !== 'string') {
      fail(marketplaceFile, `${label}: missing "name"`);
      continue;
    }
    if (typeof entry.source !== 'string') {
      fail(marketplaceFile, `${label}: "source" must be a relative path string for a plugin inside the repo`);
      continue;
    }
    if (entry.source.includes('..')) {
      fail(marketplaceFile, `${label}: "source" must not contain "..": ${entry.source}`);
      continue;
    }
    const sourceDir = resolve(repoRoot, entry.source);
    if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
      fail(marketplaceFile, `${label}: source directory does not exist: ${entry.source}`);
      continue;
    }
    if (pluginName && entry.name !== pluginName) {
      fail(marketplaceFile, `${label}: entry name "${entry.name}" must match plugin.json name "${pluginName}"`);
    }
    if (!existsSync(join(sourceDir, 'skills')) && !existsSync(join(sourceDir, 'SKILL.md'))) {
      warn(marketplaceFile, `${label}: no skills/ directory or SKILL.md under ${entry.source}`);
    }
    if (!entry.description) warn(marketplaceFile, `${label}: no "description"`);
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

if (isDefaultRun) checkPluginManifests();

for (const line of warnings) console.warn(`warn  ${line}`);
for (const line of errors) console.error(`error ${line}`);

const summary = `checked ${checked} skill${checked === 1 ? '' : 's'}: ${errors.length} error(s), ${warnings.length} warning(s)`;
if (errors.length > 0) {
  console.error(summary);
  process.exit(1);
}
console.log(summary);