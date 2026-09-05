// Thin wrapper around the locus DOM panel in scene.html.
export class LocusOverlay {
  constructor(total) {
    this.total = total;
    this.panel = document.getElementById('locus-panel');
    this.progress = document.getElementById('locus-progress');
    this.title = document.getElementById('locus-title');
    this.description = document.getElementById('locus-description');
  }

  show(index, locus) {
    this.panel.hidden = false;
    this.progress.textContent = `${index + 1} / ${this.total}`;
    this.title.textContent = locus.title;
    this.description.textContent = locus.description;
    this.panel.classList.add('visible');
  }

  hide() {
    this.panel.classList.remove('visible');
  }
}
