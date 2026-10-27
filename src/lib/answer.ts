/** Parses "3", "-2.5", "13/27", "1 / 4", "0.25" into a number; returns null if malformed. */
export function parseNumeric(raw: string): number | null {
  const s = raw.trim().replace(/,/g, '.').replace(/\s+/g, '');
  if (!s) return null;
  const frac = /^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/.exec(s);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return Number(s);
  return null;
}

export function isCorrect(value: number, answer: number, tolerance: number): boolean {
  if (tolerance === 0) return value === answer;
  return Math.abs(value - answer) <= tolerance * Math.max(1, Math.abs(answer));
}
