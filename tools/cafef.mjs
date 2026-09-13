#!/usr/bin/env node
// Refresh world/cafef.json — the fallback edition AND the fallback board for
// the cafef-vn scene (Sàn Bảng Điện).
//
// The scene reads cafef.vn live, in the browser, through a public CORS relay
// (src/scenesjs/cafef/feed.js), and the prices live from VNDirect's dchart
// endpoint (src/scenesjs/cafef/market.js). That works, and it is what you get
// almost every time. But both are somebody else's free service, so the floor
// keeps a printed copy of each: if the relays all fail the bays show this
// file's stories, and if dchart fails the board shows this file's prices.
//
// Like everything under world/ this is DATA — machine-written, never
// hand-edited (see "The living world" in CLAUDE.md). It is not canon and
// nothing about the room's geometry depends on it.
//
//   node tools/cafef.mjs            # refresh world/cafef.json
//   node tools/cafef.mjs --print    # write nothing, just show what it found
//
// Node runs this server-side, so it talks to both hosts directly — no relay,
// no CORS. Zero dependencies, like tools/news.mjs and tools/tick.mjs.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const HOST = 'cafef.vn';
const IMG_HOSTS = ['cafefcdn.com', 'cafef.vn'];
const PER_CAT = 7;
const OUT = fileURLToPath(new URL('../world/cafef.json', import.meta.url));
const TZ_OFFSET = 7;

const CATS = [
  ['thi-truong-chung-khoan', 'Chứng khoán'],
  ['doanh-nghiep', 'Doanh nghiệp'],
  ['tai-chinh-ngan-hang', 'Tài chính · Ngân hàng'],
  ['bat-dong-san', 'Bất động sản'],
  ['vi-mo-dau-tu', 'Vĩ mô · Đầu tư'],
  ['tai-chinh-quoc-te', 'Tài chính quốc tế'],
  ['kinh-te-so', 'Kinh tế số'],
  ['smart-money', 'Smart Money'],
];

const INDICES = [['VNINDEX', 'VN-INDEX'], ['VN30', 'VN30'], ['HNX', 'HNX-INDEX'], ['UPCOM', 'UPCOM']];
const TICKERS = [
  'VCB', 'BID', 'CTG', 'TCB', 'VPB', 'MBB', 'ACB', 'STB',
  'HPG', 'FPT', 'GAS', 'MSN', 'VNM', 'MWG', 'VIC', 'SSI',
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) memoryOS/1.0';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** `Sun, 13 Sep 26 16:05:00 +0700` — RFC 822 with a two-digit year. */
function pubDate(s) {
  const m = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([+-]\d{4})?/
    .exec(String(s || ''));
  if (!m) return 0;
  const mon = MONTHS.indexOf(m[2].toLowerCase());
  if (mon < 0) return 0;
  const yy = Number(m[3]);
  const off = m[7]
    ? (m[7][0] === '-' ? -1 : 1) * (Number(m[7].slice(1, 3)) * 60 + Number(m[7].slice(3, 5)))
    : 0;
  const utc = Date.UTC(yy < 100 ? 2000 + yy : yy, mon, +m[1], +m[4], +m[5], m[6] ? +m[6] : 0)
    - off * 60000;
  return Math.round(utc / 1000);
}

/** …-188260913135037459.chn carries yymmddhhmmss behind a channel prefix. */
function tsFromLink(link) {
  const m = /-(\d{14,24})\.chn/.exec(link || '');
  if (!m) return 0;
  const id = m[1];
  const now = Date.now();
  for (let i = 0; i + 12 <= id.length && i <= 6; i += 1) {
    const [yy, mo, dd, hh, mi, ss] = [0, 2, 4, 6, 8, 10].map((k) => +id.slice(i + k, i + k + 2));
    if (mo < 1 || mo > 12 || dd < 1 || dd > 31 || hh > 23 || mi > 59 || ss > 59) continue;
    const utc = Date.UTC(2000 + yy, mo - 1, dd, hh - TZ_OFFSET, mi, ss);
    if (utc <= now + 36e5 && utc > now - 45 * 864e5) return Math.round(utc / 1000);
  }
  return 0;
}

const raw = (block, name) => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(block);
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : '';
};

const strip = (html) => String(html || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim();

const hostIn = (url, list) => {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return list.some((d) => h === d || h.endsWith(`.${d}`));
  } catch { return false; }
};

async function fetchCat(key, label) {
  const res = await fetch(`https://${HOST}/${key}.rss`, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
  const xml = await res.text();
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = m[1];
    const t = strip(raw(block, 'title'));
    const link = strip(raw(block, 'link'));
    if (!t || !hostIn(link, [HOST])) continue;
    const desc = raw(block, 'description');
    let img = /<img[^>]+src=["']([^"']+)["']/i.exec(desc)?.[1] || '';
    if (img && !hostIn(img, IMG_HOSTS)) img = '';
    items.push({
      t,
      link,
      img: img.replace(/\/zoom\/\d+_\d+\//, '/zoom/480_252/'),
      desc: strip(desc).slice(0, 240),
      ts: pubDate(raw(block, 'pubDate')) || tsFromLink(link),
    });
    if (items.length >= PER_CAT) break;
  }
  return { key, label, items };
}

async function quote(code, label, kind) {
  const to = Math.round(Date.now() / 1000);
  const from = to - 30 * 86400;
  const url = `https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=${code}&from=${from}&to=${to}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  const d = await res.json();
  if (d.s !== 'ok' || !Array.isArray(d.c) || d.c.length < 2) throw new Error(`${code}: no series`);
  const n = d.c.length;
  const last = d.c[n - 1];
  const prev = d.c[n - 2];
  return {
    code,
    label,
    kind,
    last,
    prev,
    change: last - prev,
    pct: prev ? ((last - prev) / prev) * 100 : 0,
    vol: d.v?.[n - 1] || 0,
    high: d.h?.[n - 1] ?? last,
    low: d.l?.[n - 1] ?? last,
    at: d.t?.[n - 1] || 0,
  };
}

/* ------------------------------------------------------------------- news */

const cats = [];
for (const [key, label] of CATS) {
  try {
    /* eslint-disable no-await-in-loop */
    const c = await fetchCat(key, label);
    /* eslint-enable no-await-in-loop */
    cats.push(c);
    console.log(`  ${label.padEnd(22)} ${c.items.length} tin`);
  } catch (err) {
    console.warn(`  ${label.padEnd(22)} failed — ${err.message}`);
  }
}

/* ------------------------------------------------------------------ board */

const indices = [];
const stocks = [];
for (const [code, label] of INDICES) {
  try {
    /* eslint-disable no-await-in-loop */
    indices.push(await quote(code, label, 'index'));
    /* eslint-enable no-await-in-loop */
  } catch (err) { console.warn(`  ${code.padEnd(22)} failed — ${err.message}`); }
}
for (const code of TICKERS) {
  try {
    /* eslint-disable no-await-in-loop */
    stocks.push(await quote(code, code, 'stock'));
    /* eslint-enable no-await-in-loop */
  } catch (err) { console.warn(`  ${code.padEnd(22)} failed — ${err.message}`); }
}
console.log(`  bảng điện${' '.repeat(13)} ${indices.length} chỉ số, ${stocks.length} mã`);

const total = cats.reduce((n, c) => n + c.items.length, 0);
if (!total && !stocks.length) {
  console.error('cafef: nothing fetched; leaving world/cafef.json alone');
  process.exit(1);
}

const out = {
  version: 1,
  site: HOST,
  title: 'CafeF',
  built: Math.round(Date.now() / 1000),
  total,
  cats,
  market: {
    at: Math.max(0, ...indices.map((q) => q.at), ...stocks.map((q) => q.at)),
    indices,
    stocks,
  },
};

if (process.argv.includes('--print')) {
  console.log(JSON.stringify(out, null, 2));
} else {
  await writeFile(OUT, `${JSON.stringify(out, null, 1)}\n`, 'utf8');
  console.log(`cafef: ${total} stories and ${indices.length + stocks.length} quotes written to world/cafef.json`);
}
