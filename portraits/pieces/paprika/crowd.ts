// The festival crowd behind the dreamer: beckoning cats and paper lanterns, each drawn once as a
// symbol and placed many times. A placement says where a thing stands, how big it is, and which
// way it faces; a cat may also wear another coat or hold a gold coin.

const r = (v: number) => Math.round(v * 10) / 10;

export type Cat = { at: [number, number]; size: number; flip?: true; coat?: string; koban?: true }; // at: the head's center; size: its width
export type Lantern = { at: [number, number]; width: number }; // at: the body's center

// A beckoning cat (maneki-neko) in a 100 by 120 box, head centered at (50, 40) and 64 wide, the
// paw raised on the viewer's right. The coat takes --coat.
const CAT = `<symbol id="cat" viewBox="0 0 100 120" overflow="visible">
<g fill="var(--coat, #f8f2ea)" stroke="#b9a497" stroke-width="1" stroke-linejoin="round">
<path d="M21 33C20 22 22 12 26 5C33 9 40 15 44 19ZM79 33C80 22 78 12 74 5C67 9 60 15 56 19Z"/>
<path d="M50 58C68 58 80 70 81 88C82 106 74 117 50 117C26 117 18 106 19 88C20 70 32 58 50 58Z"/>
<path d="M66 72C72 64 76 54 78 46C80 39 89 40 89 48C89 56 83 67 75 79Z"/>
<path d="M50 15C72 15 82 27 82 40C82 54 68 64 50 64C32 64 18 54 18 40C18 27 28 15 50 15Z"/>
</g>
<path fill="#e9877d" d="M25 26C25 19 26 14 28 10C33 13 37 17 39 20ZM75 26C75 19 74 14 72 10C67 13 63 17 61 20Z"/>
<path fill="#5a3c32" opacity=".14" d="M70 22C80 30 83 45 74 56C70 60 64 62 58 63C70 56 76 44 70 22ZM68 66C78 74 82 90 78 104C74 112 66 116 58 117C70 108 74 87 68 66Z"/>
<ellipse cx="36" cy="96" rx="8" ry="9" fill="none" stroke="#b9a497" stroke-width="1"/>
<path fill="#d63a2f" d="M27 60C38 68 62 68 73 60L74 66C62 75 38 75 26 66Z"/>
<circle cx="50" cy="72" r="6" fill="#f0b53c"/><path d="M44.5 71.5H55.5" stroke="#9a6a16" stroke-width="1"/><circle cx="50" cy="75" r="1.2" fill="#6b4710"/>
<g fill="#e8a930"><ellipse cx="38" cy="40" rx="5.6" ry="6.2"/><ellipse cx="62" cy="40" rx="5.6" ry="6.2"/></g>
<g fill="#20170f"><ellipse cx="38.6" cy="40.6" rx="3.2" ry="4.4"/><ellipse cx="62.6" cy="40.6" rx="3.2" ry="4.4"/></g>
<g fill="#fff"><circle cx="36.6" cy="38" r="1.4"/><circle cx="60.6" cy="38" r="1.4"/></g>
<g fill="#f2a49a" opacity=".6"><ellipse cx="29" cy="50" rx="4" ry="2.4"/><ellipse cx="71" cy="50" rx="4" ry="2.4"/></g>
<path fill="#e07e78" d="M47.5 47H52.5L50 49.8Z"/>
<path fill="none" stroke="#9b4a42" stroke-width="1.1" stroke-linecap="round" d="M45 51.5C47 54 49 53.5 50 51.5C51 53.5 53 54 55 51.5"/>
<path stroke="#c9b7ab" stroke-width=".8" d="M29 47L19 45M29 50L19 51M71 47L81 45M71 50L81 51"/>
</symbol>
<symbol id="cat-koban" viewBox="0 0 100 120" overflow="visible">
<use href="#cat"/>
<ellipse cx="50" cy="95" rx="11" ry="14" fill="#f0c247" stroke="#b8862a" stroke-width="1.5"/>
<path d="M43 89H57M42 95H58M43 101H57" stroke="#c9952c" stroke-width="1"/>
</symbol>`;

// A paper lantern (chōchin) in a 100 by 140 box: a body of red and white bands between black
// caps, with a glint. Each band lies between two meridians of the body, and a meridian of an
// ellipsoid seen from the front is half an ellipse, so every band is two elliptical arcs.
const BODY = { cx: 50, cy: 72, rx: 44, ry: 54 };
const BANDS = 7; // across the visible half, red at both rims and in the middle

function band(a: number, b: number): string {
  const { cx, cy, rx, ry } = BODY;
  const top = `${cx} ${cy - ry}`;
  const bottom = `${cx} ${cy + ry}`;
  // Down one meridian and back up the other; a meridian on the right sweeps clockwise going down.
  const down = (s: number) => (Math.abs(s) < 1e-9 ? `L${bottom}` : `A${r(rx * Math.abs(s))} ${ry} 0 0 ${s > 0 ? 1 : 0} ${bottom}`);
  const up = (s: number) => (Math.abs(s) < 1e-9 ? `L${top}` : `A${r(rx * Math.abs(s))} ${ry} 0 0 ${s > 0 ? 0 : 1} ${top}`);
  return `M${top}${down(Math.sin(b))}${up(Math.sin(a))}Z`;
}

function lantern(): string {
  const { cx, cy, rx, ry } = BODY;
  const edges = Array.from({ length: BANDS + 1 }, (_, k) => -Math.PI / 2 + (k * Math.PI) / BANDS);
  const red = edges.slice(0, -1).flatMap((a, k) => (k % 2 === 0 ? [band(a, edges[k + 1])] : []));
  return `<symbol id="lantern" viewBox="0 0 100 140" overflow="visible">
<radialGradient id="lantern-light" cx=".38" cy=".38" r=".7"><stop offset=".5" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#5a0d08" stop-opacity=".32"/></radialGradient>
<path d="M50 10V-4" stroke="#2a2020" stroke-width="1.5"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f6efe6"/>
<path fill="#e1302a" d="${red.join("")}"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#lantern-light)"/>
<path fill="#fff" d="M35 48Q36 55 43 56Q36 57 35 64Q34 57 27 56Q34 55 35 48Z"/>
<rect x="30" y="10" width="40" height="12" rx="3" fill="#1d1a1f"/><rect x="32" y="20" width="36" height="2.5" fill="#c99a3a"/>
<rect x="28" y="122" width="44" height="12" rx="3" fill="#1d1a1f"/><rect x="30" y="121" width="40" height="2.5" fill="#c99a3a"/>
</symbol>`;
}

export const symbols = () => CAT + "\n" + lantern();

export function placements(cats: Cat[], lanterns: Lantern[]): string {
  const cat = ({ at: [x, y], size, flip, coat, koban }: Cat) => {
    const s = size / 64;
    const style = coat ? ` style="--coat:${coat}"` : "";
    const mirror = flip ? `translate(${r(2 * x)} 0) scale(-1 1) ` : "";
    return `<use href="#${koban ? "cat-koban" : "cat"}" width="100" height="120" transform="${mirror}translate(${r(x - 50 * s)} ${r(y - 40 * s)}) scale(${r(s * 1000) / 1000})"${style}/>`;
  };
  const lamp = ({ at: [x, y], width }: Lantern) => {
    const s = width / (2 * BODY.rx);
    return `<use href="#lantern" width="100" height="140" transform="translate(${r(x - BODY.cx * s)} ${r(y - BODY.cy * s)}) scale(${r(s * 1000) / 1000})"/>`;
  };
  // Smaller things stand farther back, so they are placed first.
  const all = [...cats.map((c) => [c.size, cat(c)] as const), ...lanterns.map((l) => [l.width * 0.8, lamp(l)] as const)];
  return `<g id="crowd">${all.sort((a, b) => a[0] - b[0]).map(([, m]) => m).join("")}</g>`;
}
