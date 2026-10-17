// How a hand types: what the text box holds after each key, and when.
//
// A typist's keys do not fall like a metronome. The gaps between them are log-normal: most near the typist's
// pace, a few much longer. They lengthen at the start of a word, where the next word is being found, and more
// after punctuation, where the next thought is; a capital costs the reach for shift. Now and then a finger lands
// on a neighbouring key; a few keys later the typist sees it, stops, takes back to the slip, and goes on.
//
// Times are in seconds.
export const ORDINARY = { pace: 26, slips: 0.012 };
// Each key's neighbours on a QWERTY board, for the slips.
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
function neighbour(c, random) {
    const lower = c.toLowerCase();
    for (const [r, row] of ROWS.entries()) {
        const i = row.indexOf(lower);
        if (i < 0)
            continue;
        const near = [row[i - 1], row[i + 1], ROWS[r - 1]?.[i], ROWS[r + 1]?.[i]].filter(Boolean);
        const n = random.choice(near);
        return c === lower ? n : n.toUpperCase();
    }
    return c;
}
// The keys that type `text` after what the box already holds.
export function typing(before, text, random, typist = ORDINARY) {
    const keys = [];
    const beat = 1 / typist.pace;
    let shown = before;
    // How the gap before typing `c` stretches with what came before it.
    const gap = (c, prev) => {
        let g = random.lognormal(beat, 0.35);
        if (prev === " ")
            g *= 1.5;
        if (/[.,;:!?]/.test(prev))
            g *= 2.2;
        if (c !== c.toLowerCase())
            g += beat * 0.6;
        return g;
    };
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const prev = i ? text[i - 1] : "";
        if (/[a-z]/i.test(c) && random.chance(typist.slips)) {
            // The slip, and the keys typed on before it is seen: never past the end of the word.
            const wrong = neighbour(c, random);
            const after = text.slice(i + 1).match(/^[^ ]{0,2}/)[0].slice(0, Math.floor(random.uniform(0, 3)));
            shown += wrong;
            keys.push({ text: shown, gap: gap(wrong, prev) });
            for (const a of after) {
                shown += a;
                keys.push({ text: shown, gap: random.lognormal(beat, 0.3) });
            }
            // The pause of seeing it, then backspace, quicker than typing.
            for (let k = 0; k <= after.length; k++) {
                shown = shown.slice(0, -1);
                keys.push({ text: shown, gap: k ? random.lognormal(beat * 0.6, 0.2) : random.lognormal(beat * 6, 0.25) });
            }
        }
        shown += c;
        keys.push({ text: shown, gap: gap(c, prev) });
    }
    return keys;
}
