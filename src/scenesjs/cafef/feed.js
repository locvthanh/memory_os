// Today's cafef.vn, fetched in the browser.
//
// Same contract as src/scenesjs/tuoitre/feed.js — three public relays, RACED
// per section, first usable answer wins, snapshot in world/cafef.json if every
// one of them refuses — but CafeF's RSS is shaped differently enough that it
// needs its own parser rather than a shared one:
//
//   - The date is RFC-822 with a TWO-DIGIT YEAR: `Sun, 13 Sep 26 16:05:00
//     +0700`. `new Date()` is entitled to read that as 1926, and in some
//     engines does, so it is parsed by hand below.
//   - There is no <enclosure> and no <author>. The photo is an <img> inside
//     the CDATA of <description>, ahead of the summary text, so the same tag
//     has to yield both the picture and the words.
//   - Photos live on cafefcdn.com, not on cafef.vn, so the host check has to
//     allow a second domain — and it matters that it is a check at all: the
//     texture on a story panel comes straight off that image, and an <img>
//     from a host that sends no CORS header taints the canvas and WebGL
//     refuses to upload it.
//   - Article ids carry their own timestamp, like tuoitre's, but behind a
//     channel prefix whose length varies by section (188…, 4…, 36…). Hence
//     `tsFromLink` sliding a window rather than matching a fixed offset.
//
// CafeF also publishes far more sections than a room can hold. The eight below
// are the money half of the site — the half a trading floor is about.

const HOST = 'cafef.vn';
const IMG_HOSTS = ['cafefcdn.com', 'cafef.vn', 'sohanews.sohacdn.com', 'cafebiz.cafebizcdn.vn'];
const PER_CAT = 7;

// key (the .rss slug), Vietnamese label, English gloss, colour. The order is
// the order they run round the hall, starting at the board and working back
// toward the doors.
export const CATS = [
  { key: 'thi-truong-chung-khoan', label: 'Chứng khoán', en: 'Markets', color: '#1e8449' },
  { key: 'doanh-nghiep', label: 'Doanh nghiệp', en: 'Companies', color: '#2471a3' },
  { key: 'tai-chinh-ngan-hang', label: 'Tài chính · Ngân hàng', en: 'Banking', color: '#117a65' },
  { key: 'bat-dong-san', label: 'Bất động sản', en: 'Property', color: '#ca6f1e' },
  { key: 'vi-mo-dau-tu', label: 'Vĩ mô · Đầu tư', en: 'Macro', color: '#2e4053' },
  { key: 'tai-chinh-quoc-te', label: 'Tài chính quốc tế', en: 'World', color: '#7d3c98' },
  { key: 'kinh-te-so', label: 'Kinh tế số', en: 'Digital', color: '#16a085' },
  { key: 'smart-money', label: 'Smart Money', en: 'Personal finance', color: '#b7950b' },
];

const SOURCES = [
  {
    name: 'rss2json',
    url: (u) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(u)}`,
    parse: parseRss2Json,
  },
  {
    name: 'allorigins',
    url: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    parse: parseXml,
  },
  {
    name: 'codetabs',
    url: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    parse: parseXml,
  },
];

export const TZ_OFFSET = 7; // Vietnam, UTC+7

/** The wall clock in Vietnam right now, as a float hour 0..24. */
export function vnHour() {
  const now = new Date();
  return ((now.getUTCHours() + TZ_OFFSET) % 24) + now.getUTCMinutes() / 60;
}

/** 0 = Sunday … 6 = Saturday, in Vietnam. The market is shut at the weekend. */
export function vnDay() {
  return new Date(Date.now() + TZ_OFFSET * 3600e3).getUTCDay();
}

export function vnDateLine(d = new Date()) {
  const t = new Date(d.getTime() + TZ_OFFSET * 3600e3);
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return `${days[t.getUTCDay()]}, ${t.getUTCDate()}/${t.getUTCMonth() + 1}/${t.getUTCFullYear()}`;
}

/** "vừa xong" / "12 phút trước" / "3 giờ trước" / "hôm qua". */
export function viAgo(ts) {
  if (!ts) return '';
  const m = Math.max(0, (Date.now() / 1000 - ts) / 60);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${Math.round(m)} phút trước`;
  const h = m / 60;
  if (h < 24) return `${Math.round(h)} giờ trước`;
  const d = Math.round(h / 24);
  return d === 1 ? 'hôm qua' : `${d} ngày trước`;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Two shapes, both seen in the wild:
 *   `Sun, 13 Sep 26 16:05:00 +0700`   — CafeF's own RSS, two-digit year
 *   `2026-09-13 06:50:00`             — what rss2json hands back, already UTC
 */
function parsePubDate(s) {
  const str = String(s || '').trim();
  if (!str) return 0;

  const iso = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/.exec(str);
  if (iso) {
    return Math.round(Date.UTC(+iso[1], +iso[2] - 1, +iso[3], +iso[4], +iso[5], +iso[6]) / 1000);
  }

  const m = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([+-]\d{4})?/
    .exec(str);
  if (!m) return 0;
  const mon = MONTHS.indexOf(m[2].toLowerCase());
  if (mon < 0) return 0;
  const yy = Number(m[3]);
  const year = yy < 100 ? 2000 + yy : yy;
  // No offset given means the stamp is already UTC; +0700 means subtract seven.
  const offMin = m[7]
    ? (m[7][0] === '-' ? -1 : 1) * (Number(m[7].slice(1, 3)) * 60 + Number(m[7].slice(3, 5)))
    : 0;
  const utc = Date.UTC(year, mon, +m[1], +m[4], +m[5], m[6] ? +m[6] : 0) - offMin * 60000;
  return Math.round(utc / 1000);
}

/**
 * CafeF article ids carry the moment the piece was created:
 *   …-188260913135037459.chn
 *       ^^^ channel   ^^^^^^^^^^^^ 260913 135037 = yymmdd hhmmss, Vietnam time
 * The channel prefix is a different length in different sections, so rather
 * than matching a fixed offset this slides a twelve-digit window along the id
 * and keeps the first reading that lands inside the last few weeks.
 */
function tsFromLink(link) {
  const m = /-(\d{14,24})\.chn(?:$|[?#])/.exec(link || '');
  if (!m) return 0;
  const id = m[1];
  const now = Date.now();
  for (let i = 0; i + 12 <= id.length && i <= 6; i += 1) {
    const yy = +id.slice(i, i + 2);
    const mo = +id.slice(i + 2, i + 4);
    const dd = +id.slice(i + 4, i + 6);
    const hh = +id.slice(i + 6, i + 8);
    const mi = +id.slice(i + 8, i + 10);
    const ss = +id.slice(i + 10, i + 12);
    if (mo < 1 || mo > 12 || dd < 1 || dd > 31 || hh > 23 || mi > 59 || ss > 59) continue;
    const utc = Date.UTC(2000 + yy, mo - 1, dd, hh - TZ_OFFSET, mi, ss);
    if (Number.isFinite(utc) && utc <= now + 36e5 && utc > now - 45 * 864e5) {
      return Math.round(utc / 1000);
    }
  }
  return 0;
}

function linkOk(url) {
  try {
    const h = new URL(url, `https://${HOST}`).hostname.toLowerCase();
    return h === HOST || h.endsWith(`.${HOST}`);
  } catch {
    return false;
  }
}

/** The photo comes off a CDN, and only from hosts known to send CORS headers —
 *  anything else taints the canvas and the panel goes blank. */
function imgOk(url) {
  try {
    const h = new URL(url, `https://${HOST}`).hostname.toLowerCase();
    return IMG_HOSTS.some((d) => h === d || h.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

const strip = (html) => String(html || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

/** CafeF's zoom renditions are `…/zoom/600_315/…`; the panel texture is only
 *  480 px wide, so ask for a smaller one and save three quarters of the bytes. */
export function thumb(url, w = 480) {
  if (!url) return '';
  return url.replace(/\/zoom\/\d+_\d+\//, `/zoom/${w}_${Math.round(w * 0.525)}/`);
}

function itemFrom({ title, link, html, pub }) {
  const t = strip(title);
  if (!t || !linkOk(link)) return null;
  let img = /<img[^>]+src=["']([^"']+)["']/i.exec(html || '')?.[1] || '';
  if (img && !imgOk(img)) img = '';
  return {
    t,
    link: String(link).trim(),
    img: thumb(img),
    desc: strip(html).slice(0, 240),
    ts: parsePubDate(pub) || tsFromLink(link),
  };
}

function parseXml(text, cat) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('bad xml');
  const items = [];
  for (const it of doc.querySelectorAll('item')) {
    const text_ = (sel) => (it.querySelector(sel)?.textContent || '').trim();
    const item = itemFrom({
      title: text_('title'),
      link: text_('link'),
      html: text_('description'),
      pub: text_('pubDate'),
    });
    if (item) items.push(item);
    if (items.length >= PER_CAT) break;
  }
  if (!items.length) throw new Error('no usable items');
  return { ...cat, items };
}

/** rss2json's JSON shape. Same fields, different names. */
function parseRss2Json(text, cat) {
  const data = JSON.parse(text);
  if (data.status !== 'ok' || !Array.isArray(data.items)) {
    throw new Error(data.message || 'rss2json said no');
  }
  const items = [];
  for (const it of data.items) {
    const html = it.content || it.description || '';
    const item = itemFrom({
      title: it.title, link: it.link, html, pub: it.pubDate,
    });
    if (!item) continue;
    // rss2json sometimes lifts the photo out into its own field instead.
    if (!item.img) {
      const alt = it.enclosure?.link || it.thumbnail || '';
      if (alt && imgOk(alt)) item.img = thumb(alt);
    }
    items.push(item);
    if (items.length >= PER_CAT) break;
  }
  if (!items.length) throw new Error('no usable items');
  return { ...cat, items };
}

async function fetchText(url, ms = 10000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCat(cat) {
  const feed = `https://${HOST}/${cat.key}.rss`;
  try {
    return await Promise.any(
      SOURCES.map((src) => fetchText(src.url(feed)).then((body) => src.parse(body, cat))),
    );
  } catch {
    console.warn(`cafef: ${cat.key} unavailable — every relay refused`);
    return { ...cat, items: [], error: 'every relay refused' };
  }
}

function assemble(cats, source) {
  const live = cats.filter((c) => c.items.length);
  let total = 0;
  let newest = 0;
  for (const c of live) {
    total += c.items.length;
    for (const i of c.items) newest = Math.max(newest, i.ts);
  }
  return {
    site: HOST,
    title: 'CafeF',
    tagline: 'Kênh tin tức kinh tế · tài chính · chứng khoán',
    cats: live,
    total,
    newest,
    built: Math.round(Date.now() / 1000),
    source,
  };
}

/** Live feed, or the committed snapshot, or (worst case) nothing at all — the
 *  hall is built either way; only the panels on the walls change. */
export async function loadFeed(setStatus = () => {}) {
  setStatus('Đọc tin — reading today’s cafef.vn…');
  try {
    const cats = await Promise.all(CATS.map(fetchCat));
    const out = assemble(cats, 'live');
    if (out.total >= 6) return out;
    throw new Error('feed came back nearly empty');
  } catch (err) {
    console.warn('cafef: live feed failed, falling back to the snapshot —', err);
  }
  setStatus('Live feed unreachable — opening the last edition on file…');
  try {
    const snapshotUrl = new URL('../../../world/cafef.json', import.meta.url);
    const r = await fetch(snapshotUrl, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const snap = await r.json();
    const byKey = new Map(CATS.map((c) => [c.key, c]));
    const cats = (snap.cats || [])
      .filter((c) => byKey.has(c.key))
      .map((c) => ({ ...byKey.get(c.key), items: (c.items || []).slice(0, PER_CAT) }));
    const out = assemble(cats, 'snapshot');
    out.built = snap.built || out.built;
    return out;
  } catch (err) {
    console.warn('cafef: no snapshot either —', err);
    return assemble([], 'none');
  }
}

/** An <img> usable as a WebGL texture, or null. Direct first, weserv second. */
export function loadImage(url) {
  const tries = url
    ? [url, `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}&w=480&output=jpg`]
    : [];
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= tries.length) return resolve(null);
      const src = tries[i];
      i += 1;
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => resolve(im);
      im.onerror = next;
      im.src = src;
      return undefined;
    };
    next();
  });
}
