import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const checkOnly = process.argv.includes('--check');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function write(rel, text) {
  fs.writeFileSync(path.join(root, rel), text, 'utf8');
}

const versionSource = read('src/version.ts');
const match = versionSource.match(/APP_VERSION\s*=\s*'([0-9]+\.[0-9]+\.[0-9]+)'/);
if (!match) {
  console.error('Cannot find APP_VERSION in src/version.ts');
  process.exit(1);
}
const version = match[1];
const [major, minor, patch] = version.split('.').map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

const mismatches = [];

function syncJson(rel, pick, apply) {
  const original = read(rel);
  const data = JSON.parse(original);
  const current = pick(data);
  if (current === version) return;
  if (checkOnly) {
    mismatches.push(`${rel}: ${current} != ${version}`);
    return;
  }
  apply(data);
  write(rel, JSON.stringify(data, null, 2) + '\n');
  console.log(`updated ${rel}: ${current} -> ${version}`);
}

syncJson(
  'package.json',
  (d) => d.version,
  (d) => {
    d.version = version;
  },
);

syncJson(
  'package-lock.json',
  (d) => d.packages?.['']?.version ?? d.version,
  (d) => {
    d.version = version;
    if (d.packages?.['']) d.packages[''].version = version;
  },
);

syncJson(
  'src-tauri/tauri.conf.json',
  (d) => d.version,
  (d) => {
    d.version = version;
  },
);

{
  const rel = 'src-tauri/Cargo.toml';
  const text = read(rel);
  const m = text.match(/^version\s*=\s*"([^"]+)"/m);
  if (!m) {
    console.error(`Cannot find package version in ${rel}`);
    process.exit(1);
  }
  if (m[1] !== version) {
    if (checkOnly) {
      mismatches.push(`${rel}: ${m[1]} != ${version}`);
    } else {
      write(rel, text.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`));
      console.log(`updated ${rel}: ${m[1]} -> ${version}`);
    }
  }
}

{
  const rel = 'android/app/build.gradle';
  const text = read(rel);
  const codeMatch = text.match(/versionCode\s+(\d+)/);
  const nameMatch = text.match(/versionName\s+"([^"]+)"/);
  if (!codeMatch || !nameMatch) {
    console.error(`Cannot find versionCode/versionName in ${rel}`);
    process.exit(1);
  }
  if (Number(codeMatch[1]) !== versionCode || nameMatch[1] !== version) {
    if (checkOnly) {
      mismatches.push(`${rel}: ${nameMatch[1]} (${codeMatch[1]}) != ${version} (${versionCode})`);
    } else {
      let next = text.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
      next = next.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
      write(rel, next);
      console.log(`updated ${rel}: ${nameMatch[1]} (${codeMatch[1]}) -> ${version} (${versionCode})`);
    }
  }
}

if (checkOnly) {
  if (mismatches.length) {
    console.error('Version mismatch:');
    for (const m of mismatches) console.error(`  - ${m}`);
    console.error('Run: npm run version:sync');
    process.exit(1);
  }
  console.log(`versions ok: ${version} (versionCode ${versionCode})`);
} else {
  console.log(`versions synced: ${version} (versionCode ${versionCode})`);
}
