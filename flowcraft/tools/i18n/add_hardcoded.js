#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DUMPS_DIR = path.join(ROOT, 'docs', 'i18n_dumps');
const DB_PKG_DIR = path.join(ROOT, 'packages', 'database');
const OUT_NAME_SUFFIX = 'merged_with_hardcoded';
const NAMESPACES = ['common','auth','dashboard','landing','workflows'];
const LANGS = ['es','en','nl'];

function guessNamespace(file) {
  const f = file.toLowerCase();
  if (f.includes('/workflow') || f.includes('/workflows') || f.includes('/execution/')) return 'workflows';
  if (f.includes('/auth') || f.includes('login') || f.includes('register')) return 'auth';
  if (f.includes('dashboard')) return 'dashboard';
  if (f.includes('landing')) return 'landing';
  return 'common';
}

function latestDumpDir() {
  const entries = fs.readdirSync(DUMPS_DIR).map(name => ({name, full: path.join(DUMPS_DIR, name), stat: fs.statSync(path.join(DUMPS_DIR, name))})).filter(e => e.stat.isDirectory());
  entries.sort((a,b)=> b.stat.mtimeMs - a.stat.mtimeMs);
  if (!entries.length) throw new Error('No dump directories found');
  return entries[0].full;
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function unflatten(map) {
  const obj = {};
  Object.entries(map).forEach(([k,v]) => {
    const parts = k.split('.');
    let cur = obj;
    for (let i=0;i<parts.length-1;i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length-1]] = v;
  });
  return obj;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0,50);
}

function main() {
  const baseDir = latestDumpDir();
  const hardcodedPath = path.join(baseDir, 'hardcoded_report.json');
  if (!fs.existsSync(hardcodedPath)) throw new Error('hardcoded_report.json not found in ' + baseDir);
  const hardcoded = JSON.parse(fs.readFileSync(hardcodedPath, 'utf8'));

  // Load merged JSONs produced by analyze (per ns/lang)
  const merged = {};
  for (const ns of NAMESPACES) {
    merged[ns] = {};
    for (const lang of LANGS) {
      const file = path.join(baseDir, `${ns}.${lang}.json`);
      if (!fs.existsSync(file)) continue;
      merged[ns][lang] = flatten(JSON.parse(fs.readFileSync(file, 'utf8')));
    }
  }

  // Add hardcoded as auto keys
  for (const entry of hardcoded) {
    const ns = guessNamespace(entry.file || '');
    for (const sample of entry.samples || []) {
      const key = `auto.${slugify(sample)}`;
      for (const lang of LANGS) {
        merged[ns][lang] = merged[ns][lang] || {};
        if (!(key in merged[ns][lang])) {
          merged[ns][lang][key] = sample; // placeholder equals detected text
        }
      }
    }
  }

  const outDir = path.join(baseDir, OUT_NAME_SUFFIX);
  fs.mkdirSync(outDir, { recursive: true });

  // Write updated ns/lang JSONs
  for (const ns of Object.keys(merged)) {
    for (const lang of Object.keys(merged[ns])) {
      const obj = unflatten(merged[ns][lang]);
      fs.writeFileSync(path.join(outDir, `${ns}.${lang}.json`), JSON.stringify(obj, null, 2));
    }
  }

  // Also write consolidated seed JSON
  const seed = { namespaces: {} };
  for (const ns of Object.keys(merged)) {
    seed.namespaces[ns] = {};
    for (const lang of Object.keys(merged[ns])) {
      seed.namespaces[ns][lang] = merged[ns][lang];
    }
  }
  const seedPath = path.join(DB_PKG_DIR, 'translations.seed.json');
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));

  console.log(outDir);
  console.log(seedPath);
}

main();
