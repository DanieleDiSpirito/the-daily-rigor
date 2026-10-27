/** Small deterministic PRNG (mulberry32) so hidden tests are reproducible. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /** Uniform integer in [lo, hi], inclusive. Safe up to ~1e15. */
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = <T,>(xs: T[]) => xs[int(0, xs.length - 1)];
  return { next, int, pick };
}

export const tokens = (s: string) => s.split(/\s+/).filter(Boolean);
