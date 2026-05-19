#!/usr/bin/env node

const { existsSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const pathSeparator = process.platform === 'win32' ? ';' : ':';

const firstExisting = (candidates) => candidates.find((candidate) => candidate && existsSync(candidate));

const nodeDir = path.dirname(process.execPath);
const bundledJavaHome = firstExisting([
  process.platform === 'win32' ? 'C:\\Program Files\\Android\\Android Studio\\jbr' : undefined,
  process.platform === 'darwin' ? '/Applications/Android Studio.app/Contents/jbr/Contents/Home' : undefined,
]);
const javaHome = bundledJavaHome || process.env.JAVA_HOME;
const androidHome =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  firstExisting([
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : undefined,
    process.env.HOME ? path.join(process.env.HOME, 'Library', 'Android', 'sdk') : undefined,
    process.env.HOME ? path.join(process.env.HOME, 'Android', 'Sdk') : undefined,
  ]);

if (javaHome) {
  process.env.JAVA_HOME = javaHome;
}

if (androidHome) {
  process.env.ANDROID_HOME = androidHome;
  process.env.ANDROID_SDK_ROOT = androidHome;
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const extraPathEntries = [
  javaHome ? path.join(javaHome, 'bin') : undefined,
  nodeDir,
  androidHome ? path.join(androidHome, 'platform-tools') : undefined,
].filter(Boolean);

process.env.PATH = [...extraPathEntries, process.env.PATH || ''].join(pathSeparator);

if (!process.argv.includes('--help')) {
  const gradlew = process.platform === 'win32' ? path.join('android', 'gradlew.bat') : path.join('android', 'gradlew');
  spawnSync(gradlew, ['--stop'], {
    stdio: 'ignore',
    env: process.env,
    shell: process.platform === 'win32',
  });
}

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npxCommand, ['expo', 'run:android', '--variant', 'prodDebug', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
