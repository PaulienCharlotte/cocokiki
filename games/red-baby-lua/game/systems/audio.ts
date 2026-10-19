export class LuaAudio {
  private context?: AudioContext;
  enabled = true;

  unlock() {
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === 'suspended') void this.context.resume();
  }

  play(kind: 'tap' | 'wrong' | 'success' | 'impact' | 'results') {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const frequency = { tap: 330, wrong: 180, success: 660, impact: 90, results: 520 }[kind];
    oscillator.type = kind === 'impact' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    if (kind === 'success' || kind === 'results') oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + .18);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.12, now + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .24);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + .25);
  }

  destroy() { void this.context?.close(); this.context = undefined; }
}
