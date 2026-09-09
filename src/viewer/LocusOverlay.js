// Thin wrapper around the locus DOM panel in scene.html.
export class LocusOverlay {
  constructor(total) {
    this.total = total;
    this.panel = document.getElementById('locus-panel');
    this.progress = document.getElementById('locus-progress');
    this.title = document.getElementById('locus-title');
    this.description = document.getElementById('locus-description');
    this.body = document.getElementById('locus-body');
    this.link = document.getElementById('locus-link');

    // On small screens the panel is docked as a bottom sheet, so the transport
    // bar, the joystick and the up/down buttons all have to sit above whatever
    // height it happens to be. Publish that height as --locus-sheet-h (0px when
    // the panel is closed) and let the stylesheet do the arithmetic.
    //
    // Observed rather than set at call sites because the panel's `hidden` flag
    // is toggled from several places in Viewer (free-mode switch, locus
    // picking, the close button), and a missed call would strand the controls
    // in mid-air.
    this._syncOffset = () => {
      const open = !this.panel.hidden && this.panel.classList.contains('visible');
      const h = open ? this.panel.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty('--locus-sheet-h', `${Math.round(h)}px`);
    };
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(this._syncOffset).observe(this.panel);
    }
    new MutationObserver(this._syncOffset).observe(this.panel, {
      attributes: true,
      attributeFilter: ['hidden', 'class'],
    });
    window.addEventListener('resize', this._syncOffset);
    this._syncOffset();
  }

  show(index, locus) {
    this.panel.hidden = false;
    this.progress.textContent = `${index + 1} / ${this.total}`;
    this.title.textContent = locus.title;
    this.description.textContent = locus.description;
    if (locus.link) {
      this.link.href = `scene.html?id=${locus.link}`;
      this.link.hidden = false;
    } else {
      this.link.hidden = true;
    }
    // Every stop starts at the top of its own text. Without this the sheet
    // keeps the previous locus's scroll offset and the next one opens
    // mid-sentence.
    this.body.scrollTop = 0;
    this.panel.classList.add('visible');
    this._syncOffset();
  }

  hide() {
    this.panel.classList.remove('visible');
    this._syncOffset();
  }

  // Fully dismiss: fade out AND take it out of the layout, so the sheet stops
  // reserving space at the bottom of the screen. `show()` reopens it.
  dismiss() {
    this.panel.classList.remove('visible');
    this.panel.hidden = true;
    this._syncOffset();
  }
}
