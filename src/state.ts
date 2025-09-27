import fs from 'fs';

export type State = {
  lastProcessedBlock: number;
  seenTx: Record<string, boolean>;
  recentBuys: number[]; // unix timestamps (seconds) for velocity window
  buys24h: number[];    // unix timestamps (seconds) for daily count
  // live-updatable thresholds
  MIN_USD?: number;
};

const PATH = '.cache/state.json';

export function loadState(): State {
  try {
    const s = JSON.parse(fs.readFileSync(PATH, 'utf8'));
    s.recentBuys ||= [];
    s.buys24h ||= [];
    s.seenTx ||= {};
    return s;
  } catch {
    return { lastProcessedBlock: 0, seenTx: {}, recentBuys: [], buys24h: [] };
  }
}
export function saveState(s: State) {
  fs.mkdirSync('.cache', { recursive: true });
  fs.writeFileSync(PATH, JSON.stringify(s));
}
