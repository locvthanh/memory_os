// The bảng điện — the board wall at the head of the hall.
//
// Two canvases, drawn straight onto two unlit planes so the board is the one
// thing in the room that makes its own light:
//
//   HEADER  the four indices, VN-INDEX huge on the left, and on the right the
//           session the market is actually in right now with a running clock.
//           Redrawn once a second, which is what the clock costs and nothing
//           more — the numbers underneath it do not move (see below).
//   GRID    sixteen of the largest listings, four across and four down, in the
//           layout a Vietnamese board uses: mã, giá, +/−, %, khối lượng.
//
// Two things about this board are worth stating plainly, because a board that
// looks live and is not would be the worst thing this scene could be:
//
//   1. THE PRICES ARE THE LAST COMPLETED SESSION'S. The only free VN market
//      series a browser can reach is daily bars. So the header stamps the
//      bar's own date, and the session strip beside it says whether the floor
//      is open at this moment at all. Walk in at 22:00 on a Sunday and the
//      board says so.
//   2. IF THE NUMBERS DO NOT COME, THE BOARD DOES NOT PRETEND. `market.ok`
//      false and the grid draws the newsroom instead: the eight sections, how
//      many stories are in each and the freshest headline in it. Same wall,
//      different contents, no blank cells and no zeroes.
//
// Colours come from market.js COLOURS and are the Vietnamese convention, not
// the Western one: green is up, red is down, yellow is unchanged, purple is a
// ceiling and cyan is a floor.
import {
  canvas, canvasTexture, FONT, fitLines,
} from '../kit.js';
import {
  COLOURS, bandColour, vn, vnVol, signed, session,
} from './market.js';
import { vnDateLine, vnHour, viAgo } from './feed.js';

const MONO = '"Consolas", "DejaVu Sans Mono", "Roboto Mono", ui-monospace, monospace';

const HEAD_W = 2048;
const HEAD_H = 224;
const GRID_W = 2048;
const GRID_H = 512;

const BG = '#080a0f';
const RULE = 'rgba(255,255,255,.09)';

function plate(g, w, h) {
  g.fillStyle = BG;
  g.fillRect(0, 0, w, h);
  // the faint horizontal scan of a big LED panel seen from across a room
  g.fillStyle = 'rgba(255,255,255,.022)';
  for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
}

/* --------------------------------------------------------------- the header */

function indexBlock(g, q, x, y, w, { big = false } = {}) {
  const col = q ? bandColour(q.pct) : COLOURS.dim;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillStyle = 'rgba(226,232,240,.66)';
  g.font = `600 ${big ? 30 : 24}px ${FONT}`;
  g.fillText(q ? q.label : '—', x, y);

  g.fillStyle = col;
  g.font = `700 ${big ? 88 : 50}px ${MONO}`;
  g.fillText(q ? vn(q.last, 2) : '—', x, y + (big ? 84 : 54));

  if (!q) return;
  g.font = `600 ${big ? 30 : 24}px ${MONO}`;
  g.fillText(
    `${signed(q.change, 2)}  (${signed(q.pct, 2)}%)`,
    x, y + (big ? 124 : 84),
  );
  if (big) {
    g.fillStyle = 'rgba(226,232,240,.42)';
    g.font = `500 24px ${FONT}`;
    g.fillText(`KL ${vnVol(q.vol)} cp`, x + w - 210, y + 124);
  }
}

function drawHeader(g, { market, data }) {
  plate(g, HEAD_W, HEAD_H);
  const byCode = new Map(market.indices.map((q) => [q.code, q]));

  indexBlock(g, byCode.get('VNINDEX'), 34, 46, 640, { big: true });
  g.fillStyle = RULE;
  g.fillRect(700, 24, 2, HEAD_H - 48);

  const rest = ['VN30', 'HNX', 'UPCOM'];
  rest.forEach((code, i) => {
    indexBlock(g, byCode.get(code), 744 + i * 260, 58, 240);
  });
  g.fillStyle = RULE;
  g.fillRect(1524, 24, 2, HEAD_H - 48);

  /* ---- the session strip: what the floor is doing at this exact minute */
  const now = session();
  const h = vnHour();
  const hh = String(Math.floor(h)).padStart(2, '0');
  const mm = String(Math.floor((h % 1) * 60)).padStart(2, '0');
  const dot = now.open ? COLOURS.up : COLOURS.dim;

  g.textAlign = 'left';
  g.fillStyle = dot;
  g.beginPath();
  g.arc(1568, 58, 11, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = now.open ? '#e8f2ea' : 'rgba(226,232,240,.72)';
  g.font = `700 30px ${FONT}`;
  g.fillText(now.vi, 1592, 68);

  g.fillStyle = 'rgba(226,232,240,.56)';
  g.font = `600 46px ${MONO}`;
  g.fillText(`${hh}:${mm}`, 1568, 128);
  g.font = `500 24px ${FONT}`;
  g.fillText('giờ Việt Nam', 1700, 128);

  g.fillStyle = 'rgba(226,232,240,.38)';
  g.font = `500 23px ${FONT}`;
  const stamp = market.at
    ? `Giá: phiên ${new Date(market.at * 1000).toLocaleDateString('vi-VN')}`
    : 'Giá: chưa có dữ liệu';
  g.fillText(stamp, 1568, 172);
  g.fillText(`${data.total} tin · ${vnDateLine()}`, 1568, 202);
}

/* ----------------------------------------------------------------- the grid */

function gridHead(g, w) {
  g.fillStyle = 'rgba(255,255,255,.05)';
  g.fillRect(0, 0, w, 52);
  g.fillStyle = 'rgba(226,232,240,.5)';
  g.font = `700 24px ${FONT}`;
  g.textBaseline = 'middle';
  const cell = w / 4;
  for (let c = 0; c < 4; c += 1) {
    const x = c * cell;
    g.textAlign = 'left';
    g.fillText('MÃ CK', x + 18, 27);
    g.textAlign = 'right';
    g.fillText('GIÁ', x + 262, 27);
    g.fillText('+/−', x + 372, 27);
    g.fillText('%', x + 474, 27);
    if (c) {
      g.fillStyle = RULE;
      g.fillRect(x, 0, 2, GRID_H);
      g.fillStyle = 'rgba(226,232,240,.5)';
    }
  }
}

function drawPrices(g, stocks) {
  plate(g, GRID_W, GRID_H);
  gridHead(g, GRID_W);
  const cell = GRID_W / 4;
  const rowH = (GRID_H - 52) / 4;

  stocks.slice(0, 16).forEach((q, i) => {
    const c = i % 4;
    const r = Math.floor(i / 4);
    const x = c * cell;
    const y = 52 + r * rowH;
    const col = bandColour(q.pct);
    if (r % 2) {
      g.fillStyle = 'rgba(255,255,255,.018)';
      g.fillRect(x + 2, y, cell - 2, rowH);
    }
    g.textBaseline = 'middle';
    const midY = y + rowH * 0.42;

    g.textAlign = 'left';
    g.fillStyle = '#f0f4f8';
    g.font = `700 42px ${FONT}`;
    g.fillText(q.code, x + 18, midY);

    g.fillStyle = col;
    g.textAlign = 'right';
    g.font = `700 42px ${MONO}`;
    g.fillText(vn(q.last, 2), x + 262, midY);
    g.font = `600 32px ${MONO}`;
    g.fillText(signed(q.change, 2), x + 372, midY);
    g.fillText(`${signed(q.pct, 2)}`, x + 474, midY);

    g.textAlign = 'left';
    g.fillStyle = 'rgba(226,232,240,.34)';
    g.font = `500 23px ${FONT}`;
    g.fillText(`KL ${vnVol(q.vol)}`, x + 18, y + rowH * 0.78);
  });
}

/** No prices to be had — so the wall reports the newsroom instead. */
function drawSections(g, data) {
  plate(g, GRID_W, GRID_H);
  g.fillStyle = 'rgba(255,255,255,.05)';
  g.fillRect(0, 0, GRID_W, 52);
  g.fillStyle = COLOURS.flat;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.font = `700 26px ${FONT}`;
  g.fillText('BẢNG ĐIỆN TẠM NGHỈ — không lấy được dữ liệu giá. Đây là bảng tin.', 20, 27);

  const cell = GRID_W / 2;
  const rowH = (GRID_H - 52) / 4;
  data.cats.slice(0, 8).forEach((cat, i) => {
    const x = (i % 2) * cell;
    const y = 52 + Math.floor(i / 2) * rowH;
    g.fillStyle = cat.color;
    g.fillRect(x + 16, y + 14, 7, rowH - 28);
    g.textAlign = 'left';
    g.fillStyle = '#f0f4f8';
    g.font = `700 32px ${FONT}`;
    g.fillText(cat.label, x + 38, y + rowH * 0.3);
    g.fillStyle = 'rgba(226,232,240,.45)';
    g.font = `600 24px ${FONT}`;
    g.textAlign = 'right';
    g.fillText(`${cat.items.length} tin`, x + cell - 26, y + rowH * 0.3);

    const lead = cat.items[0];
    if (!lead) return;
    g.textAlign = 'left';
    g.fillStyle = 'rgba(226,232,240,.72)';
    const { lines, size } = fitLines(g, lead.t, cell - 80, 2, 26, 18, '500');
    let ly = y + rowH * 0.58;
    for (const line of lines) {
      g.fillText(line, x + 38, ly);
      ly += size + 5;
    }
  });
}

/* --------------------------------------------------------------- the ribbon */

/** The headline strip that runs round the hall. One canvas, two long planes. */
export function ribbonLine(data, market) {
  const bits = [];
  if (market.ok) {
    for (const q of market.indices) {
      bits.push(`${q.label} ${vn(q.last, 2)} ${signed(q.pct, 2)}%`);
    }
  }
  for (const c of data.cats) {
    if (c.items[0]) bits.push(`${c.label.toUpperCase()}: ${c.items[0].t}`);
  }
  if (!bits.length) bits.push('KHÔNG CÓ KẾT NỐI — the live feed could not be reached');
  return `${bits.join('   ◆   ')}   ◆   `;
}

/* ---------------------------------------------------------------- the board */

export function createBoard({ market, data }) {
  const head = canvas(HEAD_W, HEAD_H);
  const grid = canvas(GRID_W, GRID_H);
  const headTex = canvasTexture(head, { anisotropy: 8 });
  const gridTex = canvasTexture(grid, { anisotropy: 8 });
  const hg = head.getContext('2d');
  const gg = grid.getContext('2d');

  if (market.ok && market.stocks.length) drawPrices(gg, market.stocks);
  else drawSections(gg, data);
  gridTex.needsUpdate = true;

  drawHeader(hg, { market, data });
  headTex.needsUpdate = true;

  let acc = 0;
  return {
    headTex,
    gridTex,
    aspectHead: HEAD_W / HEAD_H,
    aspectGrid: GRID_W / GRID_H,
    /** Only the header moves, and only once a second — it carries the clock. */
    update(dt) {
      acc += dt;
      if (acc < 1) return;
      acc = 0;
      drawHeader(hg, { market, data });
      headTex.needsUpdate = true;
    },
  };
}

/** Used by the bay signs: "Chứng khoán · 7 tin · 12 phút trước". */
export function catLine(cat) {
  const newest = cat.items[0]?.ts;
  return newest ? `${cat.items.length} tin · ${viAgo(newest)}` : `${cat.items.length} tin`;
}
