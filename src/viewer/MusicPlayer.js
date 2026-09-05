// Ambient background music for a scene. Starts muted (browsers block audio
// with sound before a user gesture anyway) and remembers the user's
// mute/unmute choice across scenes via localStorage.
const MUTE_KEY = 'memoryos-music-muted';

export class MusicPlayer {
  constructor({ src }) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = 0.35;
    this.audio.muted = this._loadMuted();
    this.audio.play().catch(() => {});
  }

  _loadMuted() {
    return localStorage.getItem(MUTE_KEY) !== 'false';
  }

  get muted() {
    return this.audio.muted;
  }

  toggleMute() {
    this.audio.muted = !this.audio.muted;
    localStorage.setItem(MUTE_KEY, String(this.audio.muted));
    if (!this.audio.muted) this.audio.play().catch(() => {});
    return this.audio.muted;
  }

  destroy() {
    this.audio.pause();
    this.audio.src = '';
  }
}
