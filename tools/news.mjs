#!/usr/bin/env node
// Refresh world/tuoitre.json — the fallback edition for the tuoitre-vn scene.
//
// The scene reads tuoitre.vn live, in the browser, through a public CORS proxy
// (src/scenesjs/tuoitre/feed.js). That works, and it is what you get almost
// every time. But a public proxy is somebody else's free service and it will
// go down eventually, so the street keeps a printed copy: if every proxy
// fails, the scene falls back to this file and you walk into the last edition
// on record instead of an empty alley.
//
// This file is DATA, like everything under world/ — machine-written, never
// hand-edited (see "The living world" in CLAUDE.md). It is not canon and
// nothing about the scene's geometry depends on it.
//
//   node tools/news.mjs            # refresh world/tuoitre.json
//   node tools/news.mjs --print    # write nothing, just show what it found
//
// Node runs this server-side, so it talks to tuoitre.vn directly — no proxy,
// no CORS. Zero dependencies, like tools/tick.mjs.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const HOST = 'tuoitre.vn';
const PER_CAT = 7;
const OUT = fileURLToPath(new URL('../world/tuoitre.json', import.meta.url));
const TZ_OFFSET = 7;

const CATS = [
  ['thoi-su', 'Thời sự'],
  ['the-gioi', 'Thế giới'],
  ['kinh-doanh', 'Kinh doanh'],
  ['cong-nghe', 'Công nghệ'],
  ['the-thao', 'Thể thao'],
  ['giai-tri', 'Giải trí'],
  ['giao-duc', 'Giáo dục'],
  ['du-lich', 'Du lịch'],
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) memoryOS/1.0';

/** tuoitre stamps items as "9/13/2026 2:18:00 PM", in Vietnam time. */
function pubDate(s) {
  const m = /(\d+)\/(\d+)\/(\d{4})\s+(\d+):(\d+):(\d+)\s*(AM|PM)?/i.exec(s || '');
  if (!m) return 0;
  let hh = Number(m[4]);
  const ap = (m[7] || '').toUpperCase();
  if (ap === 'PM' && hh < 12) hh += 12;
  if (ap === 'AM' && hh === 12) hh = 0;
  return Math.round(Date.UTC(+m[3], +m[1] - 1, +m[2], hh - TZ_OFFSET, +m[5], +m[6]) / 1000);
}

const tag = (block, name) => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(block);
  if (!m) return '';
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
};

function hostOk(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === HOST || h.endsWith(`.${HOST}`);
  } catch {
    return false;
  }
}

async function fetchCat(key, label) {
  const res = await fetch(`https://${HOST}/rss/${key}.rss`, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
  const xml = await res.text();
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = m[1];
    const t = tag(block, 'title');
    const link = tag(block, 'link');
    if (!t || !hostOk(link)) continue;
    let img = /<enclosure[^>]*url="([^"]+)"/i.exec(block)?.[1] || '';
    if (!img) img = /src="([^"]+)"/i.exec(block)?.[1] || '';
    if (img && !hostOk(img)) img = '';
    items.push({
      t,
      link,
      img: img.replace(/\/thumb_w\/\d+\//, '/thumb_w/480/'),
      desc: tag(block, 'description').slice(0, 240),
      author: tag(block, 'author').replace(/[⭐*]+$/, '').trim().slice(0, 48),
      ts: pubDate(tag(block, 'pubDate')),
    });
    if (items.length >= PER_CAT) break;
  }
  return { key, label, items };
}

const cats = [];
for (const [key, label] of CATS) {
  try {
    /* eslint-disable no-await-in-loop */
    const c = await fetchCat(key, label);
    /* eslint-enable no-await-in-loop */
    cats.push(c);
    console.log(`  ${label.padEnd(12)} ${c.items.length} tin`);
  } catch (err) {
    console.warn(`  ${label.padEnd(12)} failed — ${err.message}`);
  }
}

const total = cats.reduce((n, c) => n + c.items.length, 0);
if (!total) {
  console.error('news: nothing fetched; leaving world/tuoitre.json alone');
  process.exit(1);
}

const out = {
  version: 1,
  site: HOST,
  title: 'Tuổi Trẻ Online',
  built: Math.round(Date.now() / 1000),
  total,
  cats,
};

if (process.argv.includes('--print')) {
  console.log(JSON.stringify(out, null, 2));
} else {
  await writeFile(OUT, `${JSON.stringify(out, null, 1)}\n`, 'utf8');
  console.log(`news: ${total} stories written to world/tuoitre.json`);
}
