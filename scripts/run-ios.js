#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = process.cwd();
const iosEnvLocalPath = path.join(projectRoot, 'ios', '.xcode.env.local');
const args = process.argv.slice(2);

const appVariant = process.env.APP_VARIANT === 'test' ? 'test' : 'prod';
const scheme = appVariant === 'test' ? 'GIKTest' : 'GIKDev';
const defaultApiBaseUrl =
  appVariant === 'test' ? 'https://test-api-gik.nerizz.com/api' : 'http://localhost:8080/api';
const defaultAndroidApiBaseUrl =
  appVariant === 'test' ? defaultApiBaseUrl : 'http://10.0.2.2:8080/api';

const nodeBinary = process.env.NODE_BINARY || process.execPath;
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || defaultApiBaseUrl).trim();
const androidApiBaseUrl = (process.env.EXPO_PUBLIC_ANDROID_API_BASE_URL || defaultAndroidApiBaseUrl).trim();
const iosUsesAppleSignIn =
  process.env.IOS_USES_APPLE_SIGN_IN || (appVariant === 'test' ? 'false' : 'true');

const envLines = [
  `export NODE_BINARY=${shellEscape(nodeBinary)}`,
  `export APP_VARIANT=${shellEscape(appVariant)}`,
  `export EXPO_PUBLIC_API_BASE_URL=${shellEscape(apiBaseUrl)}`,
  `export EXPO_PUBLIC_ANDROID_API_BASE_URL=${shellEscape(androidApiBaseUrl)}`,
  `export IOS_USES_APPLE_SIGN_IN=${shellEscape(iosUsesAppleSignIn)}`,
  '',
];

fs.writeFileSync(iosEnvLocalPath, envLines.join('\n'));
console.log(`Prepared ios/.xcode.env.local for ${appVariant} variant.`);

const syncTargets = spawnSync('node', ['./scripts/sync-ios-targets.js'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

if (syncTargets.status !== 0) {
  process.exit(syncTargets.status ?? 1);
}

const hasExplicitScheme = args.includes('--scheme');
const runArgs = ['expo', 'run:ios', ...(hasExplicitScheme ? args : ['--scheme', scheme, ...args])];

const child = spawnSync('npx', runArgs, {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

process.exit(child.status ?? 1);

function shellEscape(value) {
  return JSON.stringify(String(value));
}
