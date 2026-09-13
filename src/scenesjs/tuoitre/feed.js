// Today's tuoitre.vn, fetched in the browser.
//
// Room OS reads the same feeds through its own local helper (server.py), which
// can talk to tuoitre.vn directly because it is not a browser. MemoryOS has no
// helper at all — it is static files on GitHub Pages — and tuoitre.vn's RSS
// sends no `Access-Control-Allow-Origin`, so a plain fetch from the page is
// blocked. Hence the proxy chain below: the XML comes through a public CORS
// proxy, and if every proxy is down the scene falls back to the snapshot in
// world/tuoitre.json so the street is never empty.
//
// Gotcha worth keeping: allorigins answers a browser on an https origin but
// sends NO CORS header to an http one, so the live feed works on GitHub Pages
// and never works under `npm run dev` on http://localhost — locally you always
// get the snapshot. That is why the proxies are RACED rather than tried in
// turn: eight categories x two proxies x a serial timeout was the best part of
// a minute of staring at the loading text before the fallback kicked in.
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

const PROXIES = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
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

function parseFeed(xml, cat) {
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
      ts: parsePubDate(text('pubDate')),
    });
    if (items.length >= PER_CAT) break;
  }
  return { ...cat, items };
}

async function fetchText(url, ms = 9000) {
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
      PROXIES.map((proxy) => fetchText(proxy(feed)).then((xml) => parseFeed(xml, cat))),
    );
  } catch (err) {
    console.warn(`tuoitre: ${cat.key} unavailable —`, err);
    return { ...cat, items: [], error: 'every proxy refused' };
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
