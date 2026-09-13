// The live encyclopedia.
//
// Everything in The Endless Survey is fetched while you walk. Nothing about
// this scene is baked: there is no .glb, no committed snapshot of the text, no
// nightly job. Open it and it reads today's date off your clock, asks
// Wikimedia what happened on that day, and builds the rotunda out of the
// answer; walk through a door and it fetches that article and builds the room
// beyond it out of THAT.
//
// Why Wikipedia and not britannica.com, which is what this scene was asked
// for: britannica.com sits behind a Cloudflare managed challenge. Direct
// fetch, eight different public CORS proxies and plain Node with a browser
// user-agent all come back with "Just a moment..." and a 403. There is no
// path to it from a static page on GitHub Pages, and none from a GitHub
// Action either. Wikipedia's APIs, by contrast, are built to be called from a
// browser: they send `Access-Control-Allow-Origin`, need no key, and the
// thumbnails are CORS-clean, which matters because a cross-origin image
// without those headers taints the canvas and WebGL will not upload it as a
// texture. Every room still carries a door out to the Britannica entry for
// its subject, which opens in a real browser tab where the challenge passes.
//
// Three requests build one room:
//   1. REST summary   - title, one-line description, lead paragraph, picture
//   2. parse section 0 - the lead HTML, read ONLY for its links IN ORDER.
//      `prop=links` would be easier but MediaWiki returns those alphabetically,
//      and alphabetical cross-references are not a route through anything. The
//      first links of the opening paragraphs are what the article itself
//      reaches for first, so they are the doors.
//   3. one batched query - a description and a thumbnail for each of those
//      links, so every door is labelled before you reach it.

const API = 'https://en.wikipedia.org/w/api.php';
const REST = 'https://en.wikipedia.org/api/rest_v1';
const FEED = 'https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected';

const DOORS_PER_ROOM = 6;
const TIMEOUT = 15000;

// Wikimedia rate-limits anonymous cross-origin callers, and a 429 is easy to
// earn here: every room is three requests and a room can be built every few
// seconds. So everything goes through one queue -- two requests in flight,
// 120 ms apart, retried three times on 429 with a widening gap -- and every
// answer is cached by URL for the life of the page, which is what makes
// walking back up the shaft free. `Api-User-Agent` is the header Wikimedia
// asks browser clients to identify themselves with; it costs a CORS preflight
// and is the polite price of the quota.
const UA = 'MemoryOS-EndlessSurvey/1.0 (https://locvthanh.github.io/memory_os/)';
const CACHE = new Map();
const QUEUE = [];
let inFlight = 0;
const MAX_INFLIGHT = 2;
const SPACING = 120;
let lastStart = 0;

function pump() {
  if (!QUEUE.length || inFlight >= MAX_INFLIGHT) return;
  const wait = Math.max(0, SPACING - (Date.now() - lastStart));
  if (wait) {
    setTimeout(pump, wait);
    return;
  }
  const job = QUEUE.shift();
  inFlight += 1;
  lastStart = Date.now();
  job().finally(() => {
    inFlight -= 1;
    pump();
  });
  pump();
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchOnce(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      cache: 'no-store',
      headers: { 'Api-User-Agent': UA },
    });
    if (r.status === 429) {
      const e = new Error('HTTP 429');
      e.retry = true;
      throw e;
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

function getJson(url) {
  if (CACHE.has(url)) return CACHE.get(url);
  const p = new Promise((resolve, reject) => {
    QUEUE.push(async () => {
      let last;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          resolve(await fetchOnce(url));
          return;
        } catch (err) {
          last = err;
          if (!err.retry) break;
          /* eslint-disable no-await-in-loop */
          await sleep(700 * (attempt + 1) * (attempt + 1));
          /* eslint-enable no-await-in-loop */
        }
      }
      CACHE.delete(url); // a failure must not be remembered as the answer
      reject(last);
    });
    pump();
  });
  CACHE.set(url, p);
  return p;
}

const q = (params) =>
  `${API}?origin=*&format=json&formatversion=2&${new URLSearchParams(params)}`;

/** Wikimedia hands back a 320px rendition; the murals want more than that. */
export function atWidth(url, px) {
  if (!url) return '';
  return url.replace(/\/\d{2,4}px-/, `/${px}px-`);
}

export function wikiUrl(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

/** Every room's way out to the encyclopedia this scene was named for. Deep
 *  links need Britannica's own slug, which we do not have, but its search
 *  always resolves a subject, and it opens in a real tab where Cloudflare is
 *  happy. */
export function britannicaUrl(title) {
  return `https://www.britannica.com/search?query=${encodeURIComponent(title)}`;
}

export function todayParts(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  return { mm, dd, label: `${months[d.getMonth()]} ${d.getDate()}` };
}

// ---------------------------------------------------------------- the day

/**
 * Today's selected anniversaries. `selected` rather than `all`: the full feed
 * is 1.7 MB of every birth and death on record, and the rotunda has twelve
 * cases.
 */
export async function loadDay(setStatus = () => {}) {
  const { mm, dd, label } = todayParts();
  setStatus(`Reading the day — what happened on ${label}…`);
  try {
    const data = await getJson(`${FEED}/${mm}/${dd}`);
    const items = (data.selected || [])
      .map((ev) => {
        const page = (ev.pages || []).find((p) => p.thumbnail) || (ev.pages || [])[0];
        if (!page) return null;
        return {
          year: ev.year,
          text: (ev.text || '').trim(),
          title: page.titles ? page.titles.normalized : page.title,
          key: page.titles ? page.titles.canonical : page.title,
          description: page.description || '',
          thumb: page.thumbnail ? page.thumbnail.source : '',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.year - b.year);
    if (!items.length) throw new Error('the feed came back empty');
    return { label, source: 'live', items: items.slice(0, 12) };
  } catch (err) {
    console.warn('expedition: the day could not be read —', err);
    // The standing exhibition. Not a snapshot of anything: a fixed dozen that
    // are worth a room on any day of the year, so the rotunda is never dark.
    const items = [
      ['Library of Alexandria', -283], ['Antikythera mechanism', -100],
      ['Rosetta Stone', 1799], ['Voyager 1', 1977], ['Ada Lovelace', 1843],
      ['Silk Road', -130], ['Krakatoa', 1883], ['Bletchley Park', 1939],
      ['Angkor Wat', 1150], ['Transit of Venus', 1769],
      ['Lascaux', 1940], ['Deep Blue (chess computer)', 1997],
    ].map(([title, year]) => ({ year, text: '', title, key: title, description: '', thumb: '' }));
    return { label, source: 'standing', items };
  }
}

// ------------------------------------------------------------- one article

function orderedLinks(html, self) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('table, .hatnote, .navbox, .metadata, .mw-editsection, sup')
    .forEach((el) => el.remove());
  const seen = new Set([self]);
  const out = [];
  for (const a of doc.querySelectorAll('a[href^="/wiki/"]')) {
    const href = decodeURIComponent(a.getAttribute('href').slice(6));
    if (href.includes(':') || href.includes('#')) continue; // namespaces, anchors
    const title = href.replace(/_/g, ' ');
    if (seen.has(title) || DULL.test(title)) continue;
    seen.add(title);
    out.push(title);
    if (out.length >= DOORS_PER_ROOM * 3) break; // room to drop the thin ones
  }
  return out;
}

/**
 * One article, ready to be a room: what it is, what it looks like, and the
 * six doors out of it. Returns null if the article cannot be read at all —
 * the caller turns that into a bricked-up door rather than an error.
 */
export async function loadArticle(title, setStatus = () => {}) {
  setStatus(`Fetching — ${title}…`);
  let summary;
  try {
    summary = await getJson(`${REST}/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
  } catch (err) {
    // A 404 means there is genuinely no such article and the door should be
    // bricked up for good. Anything else -- a timeout, a 429 that outlasted
    // its retries -- is the network having a bad minute, and the caller
    // should be allowed to try again when you next walk up to the door.
    if (!/HTTP 404/.test(err.message)) throw err;
    console.warn(`expedition: no such article — ${title}`);
    return null;
  }
  const name = (summary.titles && summary.titles.normalized) || summary.title || title;

  let candidates = [];
  try {
    const parsed = await getJson(q({
      action: 'parse', page: name, prop: 'text', section: '0', redirects: '1',
    }));
    candidates = orderedLinks(parsed.parse.text, name);
  } catch (err) {
    console.warn(`expedition: no lead section for ${name} —`, err);
  }

  let meta = new Map();
  if (candidates.length) {
    try {
      const data = await getJson(q({
        action: 'query', titles: candidates.join('|'), redirects: '1',
        prop: 'description|pageimages', piprop: 'thumbnail',
        pithumbsize: '400', pilimit: '50',
      }));
      for (const page of (data.query && data.query.pages) || []) {
        meta.set(page.title, {
          description: page.description || '',
          thumb: page.thumbnail ? page.thumbnail.source : '',
        });
      }
    } catch (err) {
      console.warn(`expedition: no door labels for ${name} —`, err);
      meta = new Map();
    }
  }

  // Prefer links that came back with a description: a door labelled only with
  // a name is a door you cannot choose between.
  const scored = candidates.map((t) => ({ title: t, ...(meta.get(t) || {}) }));
  const links = [
    ...scored.filter((l) => l.description),
    ...scored.filter((l) => !l.description),
  ].slice(0, DOORS_PER_ROOM);

  return {
    title: name,
    description: summary.description || '',
    extract: summary.extract || '',
    image: summary.thumbnail ? summary.thumbnail.source : '',
    thumb: summary.thumbnail ? summary.thumbnail.source : '',
    url: (summary.content_urls && summary.content_urls.desktop.page) || wikiUrl(name),
    links,
  };
}

// ------------------------------------------------------------------ images

/**
 * An <img> usable as a WebGL texture, or null.
 *
 * Three candidates, in order, because none of them works every time. The API
 * hands back a 330 px rendition, which is fine over a door and mush on a five
 * metre mural, so first ask the CDN for the size actually wanted by rewriting
 * the width in the path — that is a real Wikimedia URL form and it is
 * instant WHEN the thumbnailer has that size, and a flat 404 when it does not.
 * Then weserv, which will resize anything but takes about a second. Then the
 * original 330 px, which always exists. All three are CORS-clean, which is the
 * part that matters: an image without those headers taints the canvas and
 * WebGL refuses to upload it, and the mural comes out blank.
 */
export function loadImage(url, px = 800) {
  const tries = url
    ? [
      atWidth(url, px),
      `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}&w=${px}&output=jpg`,
      url,
    ]
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
