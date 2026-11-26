// Assembles all 18 off-center asymmetric `6x`-depth animated archival SVG worlds (`s00`..`s17`)
// and enforces cyclic `validatePortalHole` geometric invariants across every `(k -> (k + 1) % 18)` transition.
import { buildS00Chicago } from "./s00-chicago.js";
import { buildS01TokyoStudio } from "./s01-tokyo-studio.js";
import { buildS02Alley } from "./s02-alley.js";
import { buildS03ReflectingPool } from "./s03-reflecting-pool.js";
import { buildS04Glasshouse } from "./s04-glasshouse.js";
import { buildS05Pyramid } from "./s05-pyramid.js";
import { buildS06Dewdrop } from "./s06-dewdrop.js";
import { buildS07Atelier } from "./s07-atelier.js";
import { buildS08Observatory } from "./s08-observatory.js";
import { buildS09Orrery } from "./s09-orrery.js";
import { buildS10Ridge } from "./s10-ridge.js";
import { buildS11Teahouse } from "./s11-teahouse.js";
import { buildS12Cistern } from "./s12-cistern.js";
import { buildS13Geode } from "./s13-geode.js";
import { buildS14Abyss } from "./s14-abyss.js";
import { buildS15Cabinet } from "./s15-cabinet.js";
import { buildS16Printshop } from "./s16-printshop.js";
import { buildS17Library } from "./s17-library.js";
import { resolvePortal, validatePortalHole } from "./types.js";
export function buildAllScenes() {
    const scenes = [
        buildS00Chicago(),
        buildS01TokyoStudio(),
        buildS02Alley(),
        buildS03ReflectingPool(),
        buildS04Glasshouse(),
        buildS05Pyramid(),
        buildS06Dewdrop(),
        buildS07Atelier(),
        buildS08Observatory(),
        buildS09Orrery(),
        buildS10Ridge(),
        buildS11Teahouse(),
        buildS12Cistern(),
        buildS13Geode(),
        buildS14Abyss(),
        buildS15Cabinet(),
        buildS16Printshop(),
        buildS17Library(),
    ].map((s, index) => ({ ...s, index }));
    // Runtime geometric contract audit across the entire 18-world cyclic loop:
    // 1. Every scene's `hole` vertices stay strictly inside its 6x `requiredPortalSealBox` (`484x328` around `portal_k`).
    // 2. Every scene's `hole` encloses its 6x `S = 12.0` unmount `requiredPortalClearBox` (`236x160` shifted toward `portal_{k+1}`).
    const n = scenes.length;
    for (let i = 0; i < n; i++) {
        const cur = scenes[i];
        const next = scenes[(i + 1) % n];
        validatePortalHole(cur.id, cur.hole, resolvePortal(cur), resolvePortal(next));
    }
    return scenes;
}
