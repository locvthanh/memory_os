// Today's tuoitre.vn, fetched in the browser.
//
// Room OS reads the same feeds through its own local helper (server.py), which
// can talk to tuoitre.vn directly because it is not a browser. MemoryOS has no
// helper at all — it is static files on GitHub Pages — and tuoitre.vn's RSS
// sends no `Access-Control-Allow-Origin`, so a plain fetch from the page is
// blocked. Hence SOURCES below: three public relays, RACED per category, first
// usable answer wins. If all three are down the scene falls back to the
// snapshot in world/tuoitre.json so the street is never empty.
//
// Racing rather than trying them in turn is the whole design, and it is not
// premature: these are free services with no uptime promise, and one of them
// WAS already dead an hour after this was written. Serially that costs a
// timeout per category per relay — the best part of a minute of staring at the
// loading line. Raced, a dead relay costs nothing because a live one answers
// first. Two gotchas behind the list:
//
//   - allorigins answers a browser on an https origin but sends no CORS header
//     to an http one, so it never works under `npm run dev` on
//     http://localhost. Locally you always get the snapshot. Not a bug.
//   - rss2json is the sturdiest of the three (and the fastest, being cached),
//     but it returns `pubDate: null` for tuoitre because it cannot parse their
//     American date format — so timestamps come from the article URL instead,
//     see `tsFromLink`. It also returns ten items per feed, which is fine
//     while PER_CAT is seven.
//
// The PHOTOS need no proxy. cdn*.tuoitre.vn does send CORS headers, which
// matters more than it sounds: a cross-origin image without them taints the
// canvas and WebGL refuses to upload it as a texture, so every story page
// would be blank. Measured from the Pages origin: direct ~0.4 s, weserv ~1.4 s,
// so direct first and weserv only as a fallback.

const HOST = 'tuoitre.vn';
const PER_CAT = 7;

// key, Vietnamese label, colour. The eight sections Room OS walks, in the
// order they run down the street.
export const CATS = [
  { key: 'thoi-su', label: 'Thời sự', en: 'News', color: '#c0392b' },
  { key: 'the-gioi', label: 'Thế giới', en: 'World', color: '#2471a3' },
  { key: 'kinh-doanh', label: 'Kinh doanh', en: 'Business', color: '#1e8449' },
  { key: 'cong-nghe', label: 'Công nghệ', en: 'Technology', color: '#16a085' },
  { key: 'the-thao', label: 'Thể thao', en: 'Sport', color: '#d68910' },
  { key: 'giai-tri', label: 'Giải trí', en: 'Culture', color: '#8e44ad' },
  { key: 'giao-duc', label: 'Giáo dục', en: 'Education', color: '#2e4053' },
  { key: 'du-lich', label: 'Du lịch', en: 'Travel', color: '#ca6f1e' },
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

/** tuoitre stamps items as "9/13/2026 2:18:00 PM", in Vietnam time. */
function parsePubDate(s) {
  const m = /(\d+)\/(\d+)\/(\d{4})\s+(\d+):(\d+):(\d+)\s*(AM|PM)?/i.exec(s || '');
  if (!m) return 0;
  let hh = parseInt(m[4], 10);
  const ap = (m[7] || '').toUpperCase();
  if (ap === 'PM' && hh < 12) hh += 12;
  if (ap === 'AM' && hh === 12) hh = 0;
  const utc = Date.UTC(
    +m[3], +m[1] - 1, +m[2], hh - TZ_OFFSET, +m[5], +m[6],
  );
  return Math.round(utc / 1000);
}

/**
 * tuoitre's own article ids carry the timestamp: the tail of
 *   .../ong-obama-ra-canh-bao-ve-ai-...-100260913151015237.htm
 * is 100 + 260913 (yymmdd) + 151015 (hhmmss) + a serial. It is the moment the
 * article was created rather than published, so it can run an hour behind the
 * real pubDate — close enough for "3 giờ trước" on a board, and the only
 * timestamp available at all when the relay hands back a null pubDate.
 */
function tsFromLink(link) {
  const m = /-1\d{2}(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\d*\.htm/.exec(link || '');
  if (!m) return 0;
  const [, yy, mo, dd, hh, mi, ss] = m.map(Number);
  const utc = Date.UTC(2000 + yy, mo - 1, dd, hh - TZ_OFFSET, mi, ss);
  const now = Date.now();
  // sanity: inside the last month and not in the future
  if (!Number.isFinite(utc) || utc > now + 36e5 || utc < now - 40 * 864e5) return 0;
  return Math.round(utc / 1000);
}

function hostOk(url) {
  try {
    const h = new URL(url, 'https://tuoitre.vn').hostname.toLowerCase();
    return h === HOST || h.endsWith(`.${HOST}`);
  } catch {
    return false;
  }
}

/** Ask the CDN for a smaller rendition — a quarter of the bytes, and the page
 *  texture is only 448 px wide anyway. */
export function thumb(url, w = 480) {
  if (!url) return '';
  return url.replace(/\/thumb_w\/\d+\//, `/thumb_w/${w}/`);
}

function parseXml(text, cat) {
  const xml = text;
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('bad xml');
  const items = [];
  for (const it of doc.querySelectorAll('item')) {
    const text = (sel) => (it.querySelector(sel)?.textContent || '').trim();
    const title = text('title');
    const link = text('link');
    if (!title || !hostOk(link)) continue;
    let img = it.querySelector('enclosure')?.getAttribute('url') || '';
    if (!img) img = /src="([^"]+)"/.exec(text('description'))?.[1] || '';
    if (img && !hostOk(img)) img = '';
    items.push({
      t: title,
      link,
      img: thumb(img),
      desc: text('description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 240),
      author: text('author').replace(/[⭐*]+$/, '').trim().slice(0, 48),
      ts: parsePubDate(text('pubDate')) || tsFromLink(link),
    });
    if (items.length >= PER_CAT) break;
  }
  if (!items.length) throw new Error('no usable items');
  return { ...cat, items };
}

/** rss2json's JSON shape. Same fields, different names, and no pubDate. */
function parseRss2Json(text, cat) {
  const data = JSON.parse(text);
  if (data.status !== 'ok' || !Array.isArray(data.items)) {
    throw new Error(data.message || 'rss2json said no');
  }
  const items = [];
  for (const it of data.items) {
    const link = (it.link || '').trim();
    const title = (it.title || '').trim();
    if (!title || !hostOk(link)) continue;
    let img = it.enclosure?.link || it.thumbnail || '';
    if (img && !hostOk(img)) img = '';
    items.push({
      t: title,
      link,
      img: thumb(img),
      desc: String(it.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240),
      author: String(it.author || '').replace(/[⭐*]+$/, '').trim().slice(0, 48),
      ts: parsePubDate(it.pubDate) || tsFromLink(link),
    });
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
  const feed = `https://${HOST}/rss/${cat.key}.rss`;
  try {
    return await Promise.any(
      SOURCES.map((src) => fetchText(src.url(feed)).then((body) => src.parse(body, cat))),
    );
  } catch (err) {
    console.warn(`tuoitre: ${cat.key} unavailable — every relay refused`);
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
    title: 'Tuổi Trẻ Online',
    cats: live,
    total,
    newest,
    built: Math.round(Date.now() / 1000),
    source,
  };
}

/**
 * Live feed, or the committed snapshot, or (worst case) null — the caller
 * builds the street either way; only the pages on the walls change.
 */
export async function loadFeed(setStatus = () => {}) {
  setStatus('Đọc báo — reading today’s tuoitre.vn…');
  try {
    const cats = await Promise.all(CATS.map(fetchCat));
    const out = assemble(cats, 'live');
    if (out.total >= 6) return out;
    throw new Error('feed came back nearly empty');
  } catch (err) {
    console.warn('tuoitre: live feed failed, falling back to the snapshot —', err);
  }
  setStatus('Live feed unreachable — opening the last edition on file…');
  try {
    const snapshotUrl = new URL('../../../world/tuoitre.json', import.meta.url);
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
    console.warn('tuoitre: no snapshot either —', err);
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
