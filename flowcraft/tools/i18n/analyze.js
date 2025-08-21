#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const WEB_SRC = path.join(ROOT, 'apps', 'web', 'src');
const NS_DIR = path.join(WEB_SRC, 'i18n', 'namespaces');
const OUT_DIR = path.join(ROOT, 'docs', 'i18n_dumps', new Date().toISOString().replace(/[:.]/g, '').replace('T','_').slice(0,15));

const NAMESPACES = ['common','auth','dashboard','landing','workflows'];
const LANGS = ['es','en','nl'];

function walk(dir, filterExt = ['.tsx', '.ts']) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, filterExt));
    } else if (filterExt.includes(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function guessNamespace(file) {
  const f = file.toLowerCase();
  if (f.includes('/workflow') || f.includes('/workflows') || f.includes('/execution/')) return 'workflows';
  if (f.includes('/auth') || f.includes('login') || f.includes('register')) return 'auth';
  if (f.includes('dashboard')) return 'dashboard';
  if (f.includes('landing')) return 'landing';
  return 'common';
}

function extractKeys(fileContent) {
  const keys = new Set();
  // match t('key') or t("key")
  const re = /\bt\(\s*['\"]([^'\"\)]+)['\"]/g;
  let m;
  while ((m = re.exec(fileContent))) {
    keys.add(m[1]);
  }
  return Array.from(keys);
}

function detectHardcoded(fileContent) {
  // naive: find text nodes between > and < not containing { or <
  const results = [];
  const re = />\s*([^<{][^<]{2,})\s*</g;
  let m;
  while ((m = re.exec(fileContent))) {
    const txt = m[1].trim();
    if (!txt) continue;
    // skip obvious non-UI strings
    if (/^[{}\[\]0-9_,.:;-]+$/.test(txt)) continue;
    if (txt.length < 3) continue;
    results.push(txt.slice(0,200));
  }
  return Array.from(new Set(results)).slice(0,50);
}

function loadNamespace(ns, lang) {
  const p = path.join(NS_DIR, `${ns}.${lang}.json`);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8'));
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

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = walk(WEB_SRC);
  const used = {}; // ns -> Set(keys)
  const hardcoded = []; // {file, texts}

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const ns = guessNamespace(f);
    const keys = extractKeys(content);
    if (keys.length) {
      if (!used[ns]) used[ns] = new Set();
      keys.forEach(k => used[ns].add(k));
    }
    const texts = detectHardcoded(content);
    if (texts.length) hardcoded.push({ file: path.relative(ROOT, f), samples: texts });
  }

  // Load existing keys from JSON per ns/lang
  const existing = {};
  for (const ns of NAMESPACES) {
    existing[ns] = {};
    for (const lang of LANGS) {
      const json = loadNamespace(ns, lang);
      existing[ns][lang] = flatten(json);
    }
  }

  // Compute missing keys per ns
  const missing = {};
  for (const ns of Object.keys(used)) {
    const keys = Array.from(used[ns]);
    const have = new Set(Object.keys(existing[ns]?.['en'] || {}));
    const miss = keys.filter(k => !have.has(k));
    missing[ns] = miss;
  }

  // Build merged translations for missing keys with placeholders
  const merged = {};
  for (const ns of NAMESPACES) {
    merged[ns] = {};
    for (const lang of LANGS) {
      merged[ns][lang] = { ...(existing[ns]?.[lang] || {}) };
      for (const k of missing[ns] || []) {
        if (!(k in merged[ns][lang])) merged[ns][lang][k] = k; // placeholder
      }
    }
  }

  // Write report and merged files
  fs.writeFileSync(path.join(OUT_DIR, 'used_keys.json'), JSON.stringify(Object.fromEntries(Object.entries(used).map(([ns,set])=>[ns, Array.from(set)])), null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'hardcoded_report.json'), JSON.stringify(hardcoded, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'missing_keys.json'), JSON.stringify(missing, null, 2));

  // write merged per ns/lang
  for (const ns of NAMESPACES) {
    for (const lang of LANGS) {
      const obj = {};
      // unflatten
      Object.entries(merged[ns][lang]).forEach(([k,v]) => {
        const parts = k.split('.');
        let cur = obj;
        for (let i=0;i<parts.length-1;i++) {
          cur[parts[i]] = cur[parts[i]] || {};
          cur = cur[parts[i]];
        }
        cur[parts[parts.length-1]] = v;
      });
      const outPath = path.join(OUT_DIR, `${ns}.${lang}.json`);
      fs.writeFileSync(outPath, JSON.stringify(obj, null, 2));
    }
  }

  console.log(OUT_DIR);
}

main();
