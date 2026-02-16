#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const pkgPath = path.join(projectRoot, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const target = {
  expo: '~54.0.33',
  'expo-asset': '~12.0.12',
  'expo-status-bar': '~3.0.9',
  react: '19.1.0',
  'react-native': '0.81.5',
};

pkg.dependencies = pkg.dependencies || {};
let changed = false;
for (const [name, version] of Object.entries(target)) {
  if (pkg.dependencies[name] !== version) {
    pkg.dependencies[name] = version;
    changed = true;
  }
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

if (changed) {
  console.log('✅ Updated mobile/package.json to Expo SDK 54 compatible dependency versions.');
} else {
  console.log('✅ mobile/package.json already has Expo SDK 54 compatible dependency versions.');
}

console.log('\nNext steps (run in mobile/):');
console.log('  npm install --force');
console.log('  npm run doctor:sdk');
console.log('  npm run start:tunnel');
