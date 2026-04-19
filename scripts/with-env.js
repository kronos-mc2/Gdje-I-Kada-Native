#!/usr/bin/env node

const { existsSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

const [, , envName, command, ...args] = process.argv;

if (!envName || !command) {
  console.error('Usage: node scripts/with-env.js <env-name> <command> [...args]');
  process.exit(1);
}

const envFile = path.resolve(process.cwd(), `.env.${envName}`);

if (!existsSync(envFile)) {
  console.error(`Missing ${path.basename(envFile)}. Create it from ${path.basename(envFile)}.example first.`);
  process.exit(1);
}

const result = dotenv.config({ path: envFile, override: true });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.env.APP_VARIANT = process.env.APP_VARIANT || envName;
process.env.DOTENV_CONFIG_PATH = process.env.DOTENV_CONFIG_PATH || envFile;

const child = spawnSync(command, args, {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

process.exit(child.status ?? 1);
