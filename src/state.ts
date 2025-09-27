import fs from 'fs';

type State = { lastProcessedBlock: number; seenTx: Record<string, boolean> };
const PATH = '.cache/state.json';

export function loadState(): State {
  try { return JSON.parse(fs.readFileSync(PATH, 'utf8')); } catch { return { lastProcessedBlock: 0, seenTx: {} }; }
}
export function saveState(s: State) {
  fs.mkdirSync('.cache', { recursive: true });
  fs.writeFileSync(PATH, JSON.stringify(s));
}
