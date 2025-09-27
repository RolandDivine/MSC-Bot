// src/velocity.ts
type Entry = { ts: number };

export class VelocityTracker {
  private buys: Entry[] = [];
  private windowMs: number;
  private threshold: number;

  constructor(minutes: number, threshold: number) {
    this.windowMs = minutes * 60 * 1000;
    this.threshold = threshold;
  }

  record() {
    this.buys.push({ ts: Date.now() });
    this.cleanup();
  }

  check(): boolean {
    this.cleanup();
    return this.buys.length >= this.threshold;
  }

  private cleanup() {
    const cutoff = Date.now() - this.windowMs;
    this.buys = this.buys.filter(b => b.ts >= cutoff);
  }
}
