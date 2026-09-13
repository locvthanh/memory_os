// The world's two pieces of UI: a day chip, and a panel for whatever you tap.
//
// A world that changes while you are away is indistinguishable from a bug
// unless it tells you what changed. The chip is that: it remembers the day you
// last saw (per browser, in localStorage — nothing here ever reaches a server)
// and opens with the chronicle you missed.

const SEEN_KEY = 'memoryos:world:last-seen-day';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function readSeen() {
  try {
    return parseInt(localStorage.getItem(SEEN_KEY) || '0', 10) || 0;
  } catch {
    return 0; // private window, blocked storage: the world just never missed you
  }
}

function writeSeen(day) {
  try {
    localStorage.setItem(SEEN_KEY, String(day));
  } catch {
    /* ignore */
  }
}

export class WorldHud {
  constructor({ state, sceneId, stageLabel, stageOf }) {
    this.state = state;
    this.sceneId = sceneId;
    this.stageLabel = stageLabel;
    this.stageOf = stageOf;

    this.chip = el('button', 'world-chip');
    this.chip.type = 'button';
    this.chip.append(el('span', 'world-chip-day', `Day ${state.day}`));

    const seen = readSeen();
    const missed = state.chronicle.filter((c) => c.day > seen && c.scene === sceneId);
    this.missed = missed;
    if (missed.length) {
      this.chip.append(el('span', 'world-chip-dot'));
      this.chip.append(
        el('span', 'world-chip-new', `${missed.length} since you were here`),
      );
    }
    document.body.append(this.chip);

    this.panel = el('div', 'world-panel');
    this.panel.hidden = true;
    this.panelTitle = el('h3');
    this.panelSub = el('p', 'world-panel-sub');
    this.panelBody = el('div', 'world-panel-body');
    const close = el('button', 'world-panel-close', '×');
    close.type = 'button';
    close.addEventListener('click', () => this.hide());
    this.panel.append(close, this.panelTitle, this.panelSub, this.panelBody);
    document.body.append(this.panel);

    this.chip.addEventListener('click', () => this.showChronicle());
    if (missed.length) this.showChronicle();
    writeSeen(state.day);
  }

  _open(title, sub) {
    this.panelTitle.textContent = title;
    this.panelSub.textContent = sub;
    this.panelBody.replaceChildren();
    this.panel.hidden = false;
    return this.panelBody;
  }

  hide() {
    this.panel.hidden = true;
  }

  showChronicle() {
    const lines = this.state.chronicle.filter((c) => c.scene === this.sceneId).slice(-12).reverse();
    const seenNow = this.missed.length;
    const body = this._open(
      'The Chronicle',
      seenNow
        ? `${seenNow} thing${seenNow > 1 ? 's' : ''} happened while you were away`
        : `Day ${this.state.day} in the village`,
    );
    if (!lines.length) {
      body.append(el('p', 'world-empty', 'Nothing has happened yet. The village is waiting for material.'));
      return;
    }
    const ul = el('ul', 'world-log');
    for (const c of lines) {
      const li = el('li');
      li.append(el('span', 'world-log-day', `Day ${c.day}`), el('span', null, c.text));
      ul.append(li);
    }
    body.append(ul);
  }

  showPerson(person) {
    const body = this._open(person.name, `${person.role} · the Village of the Sages`);
    if (person.carrying?.length) {
      body.append(
        el('p', 'world-carry', `Carrying ${person.carrying.length} ${person.carrying[0].material}.`),
      );
    }
    const ul = el('ul', 'world-log');
    for (const line of [...person.journal].reverse()) ul.append(el('li', null, line));
    body.append(ul);
  }

  showPlot(plot) {
    const stage = this.stageOf(plot);
    const body = this._open(
      `Plot ${String(plot.id).padStart(2, '0')}`,
      `${this.stageLabel[stage]}${
        stage === 'dedicated' ? ` on day ${plot.dedicatedOn}` : ` · ${Math.round(plot.progress * 100)}%`
      }`,
    );
    if (plot.inscription) body.append(el('p', 'world-inscription', `“${plot.inscription}”`));
    if (plot.wear > 0.2) {
      body.append(el('p', 'world-wear', `Wear ${Math.round(plot.wear * 100)}% — the lamp is dimming.`));
    }
    if (plot.blocks?.length) {
      body.append(el('p', 'world-panel-sub', `Built from ${plot.blocks.length} blocks:`));
      const ul = el('ul', 'world-log');
      for (const b of plot.blocks) {
        const li = el('li');
        li.append(el('span', `world-mat world-mat-${b.material}`, b.material), el('span', null, b.text));
        ul.append(li);
      }
      body.append(ul);
    }
  }

  showYard(yard) {
    const body = this._open('The yard', `${yard.blocks.length} blocks waiting`);
    const ul = el('ul', 'world-log');
    for (const b of yard.blocks.slice(0, 14)) {
      const li = el('li');
      li.append(el('span', `world-mat world-mat-${b.material}`, b.material), el('span', null, b.text));
      ul.append(li);
    }
    body.append(ul);
  }

  dispose() {
    this.chip.remove();
    this.panel.remove();
  }
}
