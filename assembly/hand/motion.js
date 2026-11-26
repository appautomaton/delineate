// How a hand carries a pointer to a target, after what is known of human aimed movement.
//
// A reach is not one glide. The hand throws a fast primary movement at the target, which lands near it, more
// often short than long; if it lands outside, the eye catches it and the hand makes a smaller corrective
// movement, and another if need be (Meyer et al., 1988). So a small or distant target takes more corrections
// than a large near one, and the time it all takes follows Fitts's law: it grows with the log of distance over
// width (Fitts, 1954, in MacKenzie's Shannon form). Each movement is smooth in the way muscles are, its speed a
// bell that peaks a little before halfway (minimum jerk: Flash and Hogan, 1985), and its path is bowed, not
// ruled, because the wrist turns as it moves.
//
// Times are in seconds and positions in CSS pixels.
export const ORDINARY = { tempo: 1, curl: 0.05, scatter: 1 };
// Fitts's law for a mouse: a + b·log2(D/W + 1). Values in the middle of those measured for pointing.
const A = 0.07;
const B = 0.11;
// The primary movement's landing about its aim, in shares of the distance: along the line, short by a little on
// average, and scattered; across it, scattered less.
const SHORT = 0.03;
const ALONG = 0.045;
const ACROSS = 0.02;
// How many corrections a hand makes before it simply lands.
const CORRECTIONS = 3;
const minimumJerk = (u) => u * u * u * (10 - 15 * u + 6 * u * u);
// Time drawn a little ahead, so the speed peaks before halfway and the hand spends longer slowing down.
const SKEW = 0.85;
const centre = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
// Inside the box, kept clear of its edge by a little, so a landing on the very rim still reads as a miss.
function inside(p, b) {
    const m = Math.min(4, b.w * 0.2, b.h * 0.2);
    return p.x >= b.x + m && p.x <= b.x + b.w - m && p.y >= b.y + m && p.y <= b.y + b.h - m;
}
const clampInto = (p, b) => ({
    x: Math.min(Math.max(p.x, b.x + b.w * 0.3), b.x + b.w * 0.7),
    y: Math.min(Math.max(p.y, b.y + b.h * 0.3), b.y + b.h * 0.7),
});
// The movements a hand makes to bring the pointer from `from` onto `box`.
export function reach(from, box, random, style = ORDINARY) {
    const width = Math.min(box.w, box.h);
    const moves = [];
    let here = from;
    let t = 0;
    for (let i = 0; i <= CORRECTIONS; i++) {
        // Each movement aims near the middle, never exactly at it.
        const aim = { x: centre(box).x + random.normal(0, box.w * 0.08), y: centre(box).y + random.normal(0, box.h * 0.08) };
        const d = distance(here, aim);
        const dx = (aim.x - here.x) / (d || 1);
        const dy = (aim.y - here.y) / (d || 1);
        const along = d * (1 - SHORT + random.normal(0, ALONG * style.scatter));
        const across = d * random.normal(0, ACROSS * style.scatter);
        let to = { x: here.x + dx * along - dy * across, y: here.y + dy * along + dx * across };
        if (i === CORRECTIONS)
            to = clampInto(to, box);
        const dur = style.tempo * (A + B * Math.log2(d / width + 1));
        const bend = d * (style.curl + random.normal(0, 0.03));
        moves.push({ from: here, to, start: t, dur, bend });
        if (inside(to, box))
            break;
        // The eye takes a moment to see the miss before the next movement starts.
        t += dur + random.lognormal(0.06, 0.35) * style.tempo;
        here = to;
    }
    return moves;
}
// When the last movement ends.
export const span = (moves) => {
    const last = moves[moves.length - 1];
    return last.start + last.dur;
};
// Where the pointer is `t` after the reach began.
export function at(moves, t) {
    let move = moves[0];
    for (const m of moves)
        if (t >= m.start)
            move = m;
    const u = Math.min(Math.max((t - move.start) / move.dur, 0), 1);
    const s = minimumJerk(u ** SKEW);
    const { from, to } = move;
    const len = distance(from, to) || 1;
    // The bow is laid along the path's own progress, so its shape does not depend on the speed.
    const off = move.bend * 4 * s * (1 - s);
    return {
        x: from.x + (to.x - from.x) * s + (-(to.y - from.y) / len) * off,
        y: from.y + (to.y - from.y) * s + ((to.x - from.x) / len) * off,
    };
}
