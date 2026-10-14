// Numbers as the drawings write them. The worlds were first written in Python, and their output depends on
// Python's arithmetic where it differs from JavaScript's: halves round to even, and a sum of floats is
// compensated. These keep every coordinate the same to the last digit.

// v to `digits` decimals. toFixed rounds an exact half up, away from zero; Python, like correct decimal
// rounding, rounds it to the even digit. A half is exact only when v is an odd multiple of 2^-(digits + 1).
export function fixed(v: number, digits: number): string {
  const sign = v < 0 || Object.is(v, -0) ? "-" : "";
  const halves = Math.abs(v) * 2 ** (digits + 1);
  if (!Number.isInteger(halves) || halves % 2 === 0) return sign + Math.abs(v).toFixed(digits);
  // |v| * 10^digits is an odd number of halves, (2q + 1) / 2: take q or q + 1, whichever is even.
  const q = (BigInt(halves) * 5n ** BigInt(digits) - 1n) / 2n;
  const s = String(q % 2n ? q + 1n : q).padStart(digits + 1, "0");
  return sign + (digits ? `${s.slice(0, -digits)}.${s.slice(-digits)}` : s);
}

// v rounded to `digits` decimals, as a number.
export const round = (v: number, digits: number) => Number(fixed(v, digits));

// v rounded to an integer, halves to even.
export function roundEven(v: number): number {
  const floor = Math.floor(v);
  const rest = v - floor;
  return rest > 0.5 || (rest === 0.5 && floor % 2 !== 0) ? floor + 1 : floor;
}

// A sum of floats, compensated as Python's sum() compensates it (Neumaier's improvement of Kahan's method).
export function sum(values: Iterable<number>): number {
  let total = 0;
  let c = 0;
  for (const x of values) {
    const t = total + x;
    c += Math.abs(total) >= Math.abs(x) ? total - t + x : x - t + total;
    total = t;
  }
  return c && Number.isFinite(c) ? total + c : total;
}

// A coordinate as the drawings write it: one decimal at most, no trailing zeros, no leading zero ("-.5").
export function f(v: number): string {
  let s = fixed(v, 1).replace(/0+$/, "").replace(/\.$/, "");
  if (s.startsWith("0.")) s = s.slice(1);
  else if (s.startsWith("-0.")) s = "-" + s.slice(2);
  return s === "" || s === "-0" || s === "-" ? "0" : s;
}

// The length of (x, y), to the last bit as Python's math.hypot computes it: scaled into [0.5, 1), squared and
// summed in double-length arithmetic, then the square root corrected once.
export function hypot(x: number, y: number): number {
  const a = Math.abs(x);
  const b = Math.abs(y);
  if (a === Infinity || b === Infinity) return Infinity;
  const max = Math.max(a, b);
  if (Number.isNaN(max)) return NaN;
  if (max === 0) return 0;
  const exp = exponent(max);
  if (exp < -1023) return 2 ** -1022 * hypot(a / 2 ** -1022, b / 2 ** -1022);
  const scale = 2 ** -exp;
  let csum = 1;
  let frac1 = 0;
  let frac2 = 0;
  for (const v of [a, b]) {
    const [hi, lo] = square(v * scale);
    const [s, e] = fastSum(csum, hi);
    csum = s;
    frac1 += lo;
    frac2 += e;
  }
  let h = Math.sqrt(csum - 1 + (frac1 + frac2));
  const [hi, lo] = product(-h, h);
  const [s, e] = fastSum(csum, hi);
  frac1 += lo;
  frac2 += e;
  h += (s - 1 + (frac1 + frac2)) / (2 * h);
  return h / scale;
}

// frexp's exponent: max = m * 2^e with m in [0.5, 1).
function exponent(v: number): number {
  let e = Math.floor(Math.log2(v)) + 1;
  if (v * 2 ** -e >= 1) e++;
  if (v * 2 ** -e < 0.5) e--;
  return e;
}

// x * y as an unevaluated sum hi + lo, exactly (Dekker's product, Veltkamp's split).
function product(x: number, y: number): [number, number] {
  const hi = x * y;
  const [xh, xl] = split(x);
  const [yh, yl] = split(y);
  return [hi, xh * yh - hi + xh * yl + xl * yh + xl * yl];
}
const square = (x: number) => product(x, x);

function split(v: number): [number, number] {
  const c = 134217729 * v; // 2^27 + 1
  const hi = c - (c - v);
  return [hi, v - hi];
}

// a + b as hi + lo, exactly, when |a| >= |b|.
function fastSum(a: number, b: number): [number, number] {
  const s = a + b;
  return [s, b - (s - a)];
}
