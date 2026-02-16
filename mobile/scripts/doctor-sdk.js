#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const pkgPath = path.join(projectRoot, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const declaredExpo = pkg?.dependencies?.expo || '';

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

if (!declaredExpo) {
  fail('Expo dependency is missing from mobile/package.json.');
}

if (!declaredExpo.includes('54.')) {
  fail(`This project must use Expo SDK 54 for iOS Expo Go. Found expo: "${declaredExpo}".`);
}

let installedExpo = null;
try {
  installedExpo = require(path.join(projectRoot, 'node_modules', 'expo', 'package.json')).version;
} catch (_) {
  // npm install not run yet; keep this non-fatal.
}

if (installedExpo && !installedExpo.startsWith('54.')) {
  fail(`Installed expo package is ${installedExpo}, expected SDK 54.x. Run: npm install --force`);
}

console.log(`✅ Expo SDK check passed (declared: ${declaredExpo}${installedExpo ? `, installed: ${installedExpo}` : ''}).`);
