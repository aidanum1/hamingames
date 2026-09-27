#!/usr/bin/env node
/* check-site.js — static QA for the Neocities build.
   - every asset path referenced by HTML/CSS/JS/data exists (including catalog src/thumb fields)
   - every *.html link points at an existing page
   - no absolute ("/…") or localhost URLs, no external http(s) requests
   Usage: node tools/check-site.js [rootDir]   (default: project root; use neocities-deploy to check the build) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const problems = [];
const warn = [];
const exists = (rel) => fs.existsSync(path.join(ROOT, rel.split('?')[0].split('#')[0]));
const list = (dir, ext) => fs.existsSync(path.join(ROOT, dir))
  ? fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith(ext)).map(f => path.join(dir, f)) : [];

const html = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const js = list('js', '.js').concat(list('data', '.js'));
const css = list('css', '.css');

// 1) HTML references
for (const f of html) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of s.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)) {
    const u = m[1];
    if (/^(mailto:|javascript:|data:|#)/.test(u)) continue;
    if (/^https?:\/\//.test(u)) { problems.push(`${f}: external URL ${u}`); continue; }
    if (u.startsWith('/')) { problems.push(`${f}: absolute path ${u}`); continue; }
    if (!exists(u)) problems.push(`${f}: missing ${u}`);
  }
  if (/localhost|127\.0\.0\.1/.test(s)) problems.push(`${f}: mentions localhost`);
}
// 2) CSS url()
for (const f of css) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of s.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    const u = m[1];
    if (/^(data:|#)/.test(u)) continue;
    if (/^https?:/.test(u)) { problems.push(`${f}: external url() ${u}`); continue; }
    if (u.startsWith('/')) { problems.push(`${f}: absolute url() ${u}`); continue; }
    if (!fs.existsSync(path.join(ROOT, path.dirname(f), u))) problems.push(`${f}: missing url() ${u}`);
  }
}
// 3) literal asset paths + page links in JS
for (const f of js) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of s.matchAll(/['"`](assets\/[A-Za-z0-9_\-./]+\.(?:webp|png|jpg|jpeg|svg|gif|mp3|ogg|json))['"`]/g)) {
    if (!exists(m[1])) problems.push(`${f}: missing ${m[1]}`);
  }
  for (const m of s.matchAll(/['"`]([a-z0-9-]+\.html)(?:#[^'"`]*)?['"`]/g)) {
    if (!exists(m[1])) problems.push(`${f}: link to missing page ${m[1]}`);
  }
  if (/https?:\/\/(?!www\.w3\.org)/.test(s.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''))) warn.push(`${f}: contains an http(s) URL (check it is not a network request)`);
  if (/localhost|127\.0\.0\.1/.test(s)) problems.push(`${f}: mentions localhost`);
}
// 4) catalog-driven assets: evaluate data/*.js in a sandbox and check every src/thumb/exprs
const sandbox = { window: {}, console };
sandbox.window.HG = { data: {}, addStrings() {}, _pendingStrings: [] };
sandbox.HG = sandbox.window.HG;
vm.createContext(sandbox);
for (const f of list('data', '.js')) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f }); }
  catch (e) { problems.push(`${f}: failed to evaluate (${e.message})`); }
}
const D = sandbox.window.HG.data || {};
function checkSrc(where, p) { if (p && typeof p === 'string' && !exists(p)) problems.push(`catalog ${where}: missing ${p}`); }
const cats = {
  games: D.games, stickers: D.stickers, poses: D.poses, backgrounds: D.backgrounds,
  roomItems: D.roomItems, memories: D.memories, wardrobe: D.wardrobe && D.wardrobe.items
};
for (const [k, arr] of Object.entries(cats)) {
  (arr || []).forEach(it => {
    if (it.comingSoon) return;
    checkSrc(`${k}/${it.id}`, it.src); checkSrc(`${k}/${it.id}.thumb`, it.thumb);
    if (it.exprs) Object.values(it.exprs).forEach(p => checkSrc(`${k}/${it.id}.exprs`, p));
  });
}
if (D.wardrobe && D.wardrobe.body) checkSrc('wardrobe.body', D.wardrobe.body);

const uniq = [...new Set(problems)];
if (warn.length) console.log('Warnings:\n  ' + [...new Set(warn)].join('\n  '));
if (uniq.length) {
  console.log(`\n${uniq.length} problem(s):\n  ` + uniq.join('\n  '));
  process.exitCode = 1;
} else {
  console.log(`OK — ${html.length} pages, ${js.length} scripts, ${css.length} stylesheets checked in ${ROOT}`);
}
