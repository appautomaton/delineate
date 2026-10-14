// Eases one number on an object toward a value, frame by frame: the garden's intro, a water garden's tide
// coming in, a plant growing in when its garden comes on show. The ease is a power curve that leaves its start
// briskly and settles slowly, 1 - (1 - t)^power. A new tween of the same number replaces the one running.

type Options = { duration: number; power: number; onUpdate?: () => void; onComplete?: () => void };

// The tween each object's numbers are following now, by key; a replaced tween stops at its next frame.
const current = new WeakMap<object, Map<string, symbol>>();

export function tween<T extends object>(target: T, key: keyof T & string, to: number, { duration, power, onUpdate, onComplete }: Options): void {
  const from = target[key] as number;
  const id = Symbol(key);
  if (!current.has(target)) current.set(target, new Map());
  current.get(target)!.set(key, id);
  let start = -1;
  const step = (now: number) => {
    if (current.get(target)!.get(key) !== id) return;
    if (start < 0) start = now;
    const t = Math.min(1, (now - start) / duration);
    (target[key] as number) = from + (to - from) * (1 - (1 - t) ** power);
    onUpdate?.();
    if (t < 1) requestAnimationFrame(step);
    else onComplete?.();
  };
  requestAnimationFrame(step);
}
