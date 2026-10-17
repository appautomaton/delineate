// Seeded random numbers, so a run can be watched again exactly as it went: Mulberry32, and the few shapes of
// chance a hand needs.
export class Random {
    #s;
    constructor(seed) {
        this.#s = seed >>> 0;
    }
    // A float in [0, 1).
    random() {
        let t = (this.#s = (this.#s + 0x6d2b79f5) >>> 0);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
    }
    uniform(a, b) {
        return a + (b - a) * this.random();
    }
    // A normal draw, by Box and Muller.
    normal(mean = 0, sd = 1) {
        const u = 1 - this.random();
        return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * this.random());
    }
    // A log-normal draw with the given median: positive, mostly near the median, now and then much longer. The
    // shape of human reaction and keystroke times.
    lognormal(median, spread) {
        return median * Math.exp(this.normal(0, spread));
    }
    chance(p) {
        return this.random() < p;
    }
    choice(items) {
        return items[Math.floor(this.random() * items.length)];
    }
}
