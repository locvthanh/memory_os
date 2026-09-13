// The numbers on the board.
//
// A trading floor whose board is empty is a waiting room, so this fetches real
// closing prices for the four Vietnamese indices and sixteen of the largest
// listings, and the board wall draws them in the colours a Vietnamese screen
// uses (see COLOURS below — green up, red down, yellow at reference, purple on
// ceiling, cyan on floor; this is NOT the Western red/green convention and
// getting it backwards would read as a crash).
//
// Source: VNDirect's dchart history endpoint, the same public JSON that feeds
// their web charting — `{t:[…], o, h, l, c, v, s:"ok"}`, one array per field.
// It is the only free VN market series that answers a browser directly, and it
// answers over plain https with no key. Two cautions and one consequence:
//
//   - It is DAILY, so "now" means the last completed bar. The board is honest
//     about that: the header stamps the bar's own date, and `session()` says
//     whether the market is even open at the moment you are standing there.
//   - Whether it sends `Access-Control-Allow-Origin` is not promised anywhere,
//     so every request is tried direct first and then through the codetabs
//     relay, which does send one. A symbol that fails both is simply left off
//     the board rather than failing the scene.
//   - If fewer than six symbols come back at all, `loadMarket` returns
//     `{ ok: false }` and the board falls back to headline mode — sections and
//     story counts instead of prices. A blank price grid would be a lie; a
//     board showing what it does have is not.
//
// Prices are in thousands of đồng, which is how every Vietnamese board quotes
// them (VNM at 60.5 means 60,500 đ). Indices are plain points.

import { vnHour, vnDay } from './feed.js';

const BASE = 'https://dchart-api.vndirect.com.vn/dchart/history';
const PROXY = (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`;

export const INDICES = [
  { code: 'VNINDEX', label: 'VN-INDEX', floor: 'HOSE' },
  { code: 'VN30', label: 'VN30', floor: 'HOSE' },
  { code: 'HNX', label: 'HNX-INDEX', floor: 'HNX' },
  { code: 'UPCOM', label: 'UPCOM', floor: 'UPCOM' },
];

// Sixteen: four columns of four on the wall. Banks, then the industrials and
// the consumer names — roughly the order a VN30 board runs in.
export const TICKERS = [
  'VCB', 'BID', 'CTG', 'TCB',
  'VPB', 'MBB', 'ACB', 'STB',
  'HPG', 'FPT', 'GAS', 'MSN',
  'VNM', 'MWG', 'VIC', 'SSI',
];

// The Vietnamese board palette. These are not decorative.
export const COLOURS = {
  up: '#00d26a',
  down: '#ff4d5a',
  flat: '#ffd400',
  ceiling: '#e56aff',
  floor: '#00d4ff',
  dim: '#8b94a3',
};

/** Which colour a change belongs in, given the ±7% HOSE band. */
export function bandColour(pct) {
  if (!Number.isFinite(pct)) return COLOURS.dim;
  if (pct >= 6.5) return COLOURS.ceiling;
  if (pct <= -6.5) return COLOURS.floor;
  if (pct > 0.0001) return COLOURS.up;
  if (pct < -0.0001) return COLOURS.down;
  return COLOURS.flat;
}

/**
 * Where the Hanoi/HCM trading day is at hour `h`. The hall is lit and peopled
 * off this: at 11:45 the floor is half empty and the board is frozen from the
 * morning; at 21:00 it is a dark room with a board still showing the close.
 */
export function session(h = vnHour(), day = vnDay()) {
  if (day === 0 || day === 6) {
    return { key: 'weekend', vi: 'Nghỉ cuối tuần', en: 'Market closed — weekend', open: false, heat: 0 };
  }
  if (h < 8.5) return { key: 'pre', vi: 'Trước giờ mở cửa', en: 'Before the open', open: false, heat: 0.25 };
  if (h < 9.25) return { key: 'ato', vi: 'ATO — khớp lệnh mở cửa', en: 'Opening auction', open: true, heat: 0.85 };
  if (h < 11.5) return { key: 'am', vi: 'Phiên sáng — khớp lệnh liên tục', en: 'Morning session', open: true, heat: 1 };
  if (h < 13) return { key: 'lunch', vi: 'Nghỉ trưa', en: 'Lunch break', open: false, heat: 0.4 };
  if (h < 14.5) return { key: 'pm', vi: 'Phiên chiều — khớp lệnh liên tục', en: 'Afternoon session', open: true, heat: 1 };
  if (h < 14.75) return { key: 'atc', vi: 'ATC — khớp lệnh đóng cửa', en: 'Closing auction', open: true, heat: 0.95 };
  if (h < 15) return { key: 'put', vi: 'Giao dịch thỏa thuận', en: 'Put-through', open: true, heat: 0.5 };
  if (h < 18) return { key: 'post', vi: 'Đã đóng cửa', en: 'Closed', open: false, heat: 0.3 };
  return { key: 'night', vi: 'Đã đóng cửa', en: 'Closed for the day', open: false, heat: 0.12 };
}

async function fetchJson(url, ms = 9000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Direct first, relay second. Whichever answers, the shape is the same. */
async function series(code) {
  const to = Math.round(Date.now() / 1000);
  const from = to - 30 * 86400; // a month is plenty to find two closes
  const url = `${BASE}?resolution=D&symbol=${encodeURIComponent(code)}&from=${from}&to=${to}`;
  let data;
  try {
    data = await fetchJson(url);
  } catch {
    data = await fetchJson(PROXY(url), 12000);
  }
  if (!data || data.s !== 'ok' || !Array.isArray(data.c) || data.c.length < 2) {
    throw new Error(`${code}: no series`);
  }
  return data;
}

function quoteFrom(code, label, data, kind) {
  const n = data.c.length;
  const last = Number(data.c[n - 1]);
  const prev = Number(data.c[n - 2]);
  const change = last - prev;
  const pct = prev ? (change / prev) * 100 : 0;
  return {
    code,
    label: label || code,
    kind,
    last,
    prev,
    change,
    pct,
    vol: Number(data.v?.[n - 1] || 0),
    high: Number(data.h?.[n - 1] || last),
    low: Number(data.l?.[n - 1] || last),
    at: Number(data.t?.[n - 1] || 0),
  };
}

async function quote(code, label, kind) {
  try {
    return quoteFrom(code, label, await series(code), kind);
  } catch {
    return null;
  }
}

/** Run a list of jobs `width` at a time, so the browser is not asked to open
 *  twenty sockets to one host at once. */
async function pool(jobs, width = 6) {
  const out = [];
  for (let i = 0; i < jobs.length; i += width) {
    /* eslint-disable no-await-in-loop */
    out.push(...await Promise.all(jobs.slice(i, i + width).map((j) => j())));
    /* eslint-enable no-await-in-loop */
  }
  return out;
}

/**
 * @returns {{ok:boolean, indices:[], stocks:[], at:number, session:object}}
 *   ok=false means the board should show headlines instead of prices.
 */
export async function loadMarket(setStatus = () => {}) {
  const now = session();
  setStatus('Bảng điện — pulling the indices…');
  const indices = (await pool(
    INDICES.map((i) => () => quote(i.code, i.label, 'index')),
    4,
  )).filter(Boolean);

  setStatus(`Bảng điện — ${TICKERS.length} mã…`);
  const stocks = (await pool(
    TICKERS.map((c) => () => quote(c, c, 'stock')),
    6,
  )).filter(Boolean);

  if (indices.length + stocks.length >= 6) {
    // The most recent bar anyone reported; the header stamps this, so nobody
    // reads Friday's close as though it were this minute's.
    const at = Math.max(0, ...indices.map((q) => q.at), ...stocks.map((q) => q.at));
    return {
      ok: true, indices, stocks, at, session: now, source: 'live',
    };
  }

  // Nothing usable live. world/cafef.json carries the last session tools/
  // cafef.mjs managed to record, which is old but true — and old-but-true is
  // fine here because the header stamps the bar's date either way.
  try {
    const r = await fetch(new URL('../../../world/cafef.json', import.meta.url), { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const snap = (await r.json()).market;
    if (!snap || !(snap.indices?.length || snap.stocks?.length)) throw new Error('no market in snapshot');
    return {
      ok: true,
      indices: snap.indices || [],
      stocks: snap.stocks || [],
      at: snap.at || 0,
      session: now,
      source: 'snapshot',
    };
  } catch (err) {
    console.warn('cafef: no market data at all — the board falls back to headlines —', err);
  }
  return {
    ok: false, indices, stocks, at: 0, session: now, source: 'none',
  };
}

/** 1 234,5 — Vietnamese digit grouping, which is the other way round. */
export function vn(n, dp = 2) {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('vi-VN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function vnInt(n) {
  if (!Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('vi-VN');
}

/** Volumes on a board are written in millions of shares once they get big. */
export function vnVol(n) {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} tỷ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} tr`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} ng`;
  return String(Math.round(n));
}

export function signed(n, dp = 2) {
  if (!Number.isFinite(n)) return '—';
  const s = vn(Math.abs(n), dp);
  if (n > 0.0001) return `+${s}`;
  if (n < -0.0001) return `−${s}`;
  return s;
}
