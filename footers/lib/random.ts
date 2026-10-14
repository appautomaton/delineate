// Seeded random numbers: the Mersenne Twister (MT19937), keyed from an integer seed, and the few draws the
// drawings make. The worlds were composed on these sequences, so every stroke depends on getting the same
// number at the same call: change a drawing on purpose, never by changing this.

const N = 624;
const M = 397;

export class Random {
  readonly #mt = new Uint32Array(N);
  #i = N;

  constructor(seed: number) {
    // The key is the seed's magnitude, in 32-bit words, least significant first.
    const n = Math.abs(seed);
    const key = n >= 2 ** 32 ? [n % 2 ** 32, Math.floor(n / 2 ** 32)] : [n];
    this.#init(19650218);
    const mt = this.#mt;
    let i = 1;
    let j = 0;
    for (let k = Math.max(N, key.length); k; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (mt[i] ^ Math.imul(prev, 1664525)) + key[j] + j;
      i++;
      j++;
      if (i >= N) (mt[0] = mt[N - 1]), (i = 1);
      if (j >= key.length) j = 0;
    }
    for (let k = N - 1; k; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (mt[i] ^ Math.imul(prev, 1566083941)) - i;
      i++;
      if (i >= N) (mt[0] = mt[N - 1]), (i = 1);
    }
    mt[0] = 0x80000000;
  }

  // A float in [0, 1) with 53 random bits.
  random(): number {
    const a = this.#next() >>> 5;
    const b = this.#next() >>> 6;
    return (a * 2 ** 26 + b) / 2 ** 53;
  }

  uniform(a: number, b: number): number {
    return a + (b - a) * this.random();
  }

  // An integer in [0, stop), or in [start, stop).
  randrange(start: number, stop?: number): number {
    return stop === undefined ? this.#below(start) : start + this.#below(stop - start);
  }

  // An integer in [a, b], both ends included.
  randint(a: number, b: number): number {
    return this.randrange(a, b + 1);
  }

  choice<T>(seq: readonly T[]): T {
    return seq[this.#below(seq.length)];
  }

  // Shuffles in place: from the end, each item swapped with one at or before it.
  shuffle<T>(items: T[]): void {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.#below(i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }
  }

  // An integer below n: as many random bits as n has, drawn again until they fall below it.
  #below(n: number): number {
    if (!(n > 0 && n < 2 ** 32)) throw new RangeError(`no integer to draw below ${n}`);
    const k = 32 - Math.clz32(n);
    let r = this.#next() >>> (32 - k);
    while (r >= n) r = this.#next() >>> (32 - k);
    return r;
  }

  #init(s: number) {
    const mt = this.#mt;
    mt[0] = s;
    for (let i = 1; i < N; i++) mt[i] = Math.imul(1812433253, mt[i - 1] ^ (mt[i - 1] >>> 30)) + i;
  }

  #next(): number {
    const mt = this.#mt;
    if (this.#i >= N) {
      for (let k = 0; k < N; k++) {
        const y = (mt[k] & 0x80000000) | (mt[(k + 1) % N] & 0x7fffffff);
        mt[k] = mt[(k + M) % N] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
      }
      this.#i = 0;
    }
    let y = mt[this.#i++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }
}
