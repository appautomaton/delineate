// Eases one number on an object toward a value, frame by frame: the garden's intro, a water garden's tide
// coming in, a plant growing in when its garden comes on show. The ease is a power curve that leaves its start
// briskly and settles slowly, 1 - (1 - t)^power. A new tween of the same number replaces the one running.
// The tween each object's numbers are following now, by key; a replaced tween stops at its next frame.
const current = new WeakMap();
export function tween(target, key, to, { duration, power, onUpdate, onComplete }) {
    const from = target[key];
    const id = Symbol(key);
    if (!current.has(target))
        current.set(target, new Map());
    current.get(target).set(key, id);
    let start = -1;
    const step = (now) => {
        if (current.get(target).get(key) !== id)
            return;
        if (start < 0)
            start = now;
        const t = Math.min(1, (now - start) / duration);
        target[key] = from + (to - from) * (1 - (1 - t) ** power);
        onUpdate?.();
        if (t < 1)
            requestAnimationFrame(step);
        else
            onComplete?.();
    };
    requestAnimationFrame(step);
}
