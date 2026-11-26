// Shared contract for each 2400x1600 procedural animated SVG scene
// with 6x inter-scene magnification (SCENE_SCALE_RATIO = 6.0 -> 46.53 dyadic octaves across 18 worlds)
// and off-center C2-continuous zero-overshoot hierarchical portal embedding.
export const STAGE_W = 2400;
export const STAGE_H = 1600;
export const STAGE_CX = 1200;
export const STAGE_CY = 800;
/**
 * Inter-scene linear magnification ratio (`6.0x` per scene -> `log2(6) = 2.585` dyadic octaves/scene,
 * `46.53` dyadic octaves = `6^18 = 1.01e14x` total loop depth across 18 scenes!).
 * Child scene `(k + 1) % N` embeds at `1/6` scale (`400 x 266.7 px` core, `526.7 x 360 px` with BLEED)
 * centered on `(portal_k.cx, portal_k.cy)`.
 */
export const SCENE_SCALE_RATIO = 6;
export const INV_SCENE_SCALE = 1 / SCENE_SCALE_RATIO;
export const OCTAVES_PER_SCENE = Math.log2(SCENE_SCALE_RATIO);
/**
 * Fractional progress `frac` in scene `k+1` at which `Slot -1` (parent scene `k`) reaches
 * `S_{-1} = 12.0` (`6 * 6^frac = 12 -> frac = log(2)/log(6) ≈ 0.386853`) and unmounts cleanly.
 */
export const UNMOUNT_PARENT_FRAC = Math.log(2) / Math.log(SCENE_SCALE_RATIO);
/**
 * Exact C2 zero-overshoot camera pan curve `w(f)` on `f in [0, 1]`:
 *   w(f) = f^3 * (10 - 15f + 6f^2) + 8 * f^3 * (1 - f)^3
 * Properties:
 *   - w(0) = w'(0) = w''(0) = 0  and  w(1) = 1, w'(1) = w''(1) = 0 (exact C2 zero-kink at EVERY integer crossing!)
 *   - w'(f) = 3 f^2 (1 - f)^2 (10 + 8(1 - 2f)) >= 0 everywhere (strictly monotonic, 0.000px overshoot!)
 */
export function cameraPanCurve(f) {
    const u = f <= 0 ? 0 : f >= 1 ? 1 : f;
    const u3 = u * u * u;
    const v = 1 - u;
    return u3 * (10 - 15 * u + 6 * u * u) + 8 * u3 * v * v * v;
}
const UNMOUNT_SHIFT_FACTOR = cameraPanCurve(UNMOUNT_PARENT_FRAC) * INV_SCENE_SCALE; // ≈ 0.06696
/**
 * Outer overbleed bounds for every octave's opaque backdrop cutout (`[-380..2780, -280..1880]`).
 * At `1/6` child scale, spans `p_k +/- [263.3, 180.0]`, giving full parallax-safe overlap around `sealBox`.
 */
export const BLEED = {
    x0: -380,
    x1: STAGE_W + 380,
    y0: -280,
    y1: STAGE_H + 280,
};
/**
 * Legacy centered aperture bounds retained for backward compatibility with older scenes until index.ts switches.
 */
export const APERTURE = {
    childX0: 600,
    childX1: 1800,
    childY0: 400,
    childY1: 1200,
    sealX0: 620,
    sealX1: 1780,
    sealY0: 415,
    sealY1: 1185,
    clearX0: 876,
    clearX1: 1524,
    clearY0: 582,
    clearY1: 1018,
};
export const DEFAULT_PORTAL = {
    cx: STAGE_CX,
    cy: STAGE_CY,
    rx: 170,
    ry: 115,
};
function portalXY(p) {
    return Array.isArray(p) ? [p[0], p[1]] : [p.cx, p.cy];
}
export function resolvePortal(scene) {
    return scene.portal ?? DEFAULT_PORTAL;
}
/**
 * Exact worst-case visible viewport rectangle (in parent scene `k` local coordinates)
 * at the instant parent scene `k` unmounts from `Slot -1` (`S = 12.0`, `frac = log(2)/log(6) ≈ 0.3869`),
 * INCLUDING maximum pointer parallax (`+/-3.7px X`, `+/-2.5px Y` at `S = 12.0`) plus generous AA guard.
 *
 * Compact natural architectural footprint: ONLY `236 x 160 px` (`rx = 118, ry = 80`) centered at
 * `p_k + 0.06696 * (p_next - C)` (within `~24 px` of `p_k`!).
 * Enclosing this box guarantees `0.000 px` unmount pop while keeping doorways/windows/pools at
 * true architectural scale (`~260-400 x 180-270 px`, `< 3%` of canvas!).
 */
export function requiredPortalClearBox(pCurrent, pNext) {
    const [px, py] = portalXY(pCurrent);
    const [nx, ny] = portalXY(pNext);
    const cx = px + UNMOUNT_SHIFT_FACTOR * (nx - STAGE_CX);
    const cy = py + UNMOUNT_SHIFT_FACTOR * (ny - STAGE_CY);
    // 1200/12 = 100 + 3.65px max parallax at S=12 + 14.35px stroke/AA margin = 118px
    const rx = 118;
    // 800/12 = 66.67 + 2.43px max parallax at S=12 + 10.90px stroke/AA margin = 80px
    const ry = 80;
    return {
        x0: cx - rx,
        x1: cx + rx,
        y0: cy - ry,
        y1: cy + ry,
        cx,
        cy,
        rx,
        ry,
    };
}
/**
 * Exact outer seal bounds (in parent scene `k` local coordinates) covered by child scene `k+1`'s
 * opaque `BLEED` (`[-380..2780, -280..1880]` mapped at `1/6` scale onto `p_k +/- [263.3, 180.0]`),
 * inset by `21px X / 16px Y` to absorb maximum relative multi-plane pointer parallax (`17.7px X / 11.8px Y`).
 * Every vertex of scene `k`'s `hole` polygon MUST stay inside this `484 x 328 px` (`rx = 242, ry = 164`) box!
 */
export function requiredPortalSealBox(pCurrent) {
    const [px, py] = portalXY(pCurrent);
    const rx = 242;
    const ry = 164;
    return {
        x0: px - rx,
        x1: px + rx,
        y0: py - ry,
        y1: py + ry,
        cx: px,
        cy: py,
        rx,
        ry,
    };
}
function ptInPoly(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        const hit = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-9) + xi;
        if (hit)
            inside = !inside;
    }
    return inside;
}
/**
 * Runtime contract validator for an off-center `6x`-depth scene's portal cutout polygon `hole`.
 * Throws with exact coordinates if any vertex leaks past child `BLEED` seal (`484x328`) OR clips
 * the `S = 12.0` unmount clear box (`236x160`, 4 corners + 4 edge midpoints checked).
 */
export function validatePortalHole(sceneId, hole, pCurrent, pNext) {
    const seal = requiredPortalSealBox(pCurrent);
    const clear = requiredPortalClearBox(pCurrent, pNext);
    for (const [x, y] of hole) {
        if (x < seal.x0 - 1 || x > seal.x1 + 1 || y < seal.y0 - 1 || y > seal.y1 + 1) {
            throw new Error(`Scene ${sceneId} hole vertex (${x.toFixed(1)}, ${y.toFixed(1)}) breaches 6x outer seal [${seal.x0.toFixed(0)}..${seal.x1.toFixed(0)}, ${seal.y0.toFixed(0)}..${seal.y1.toFixed(0)}]`);
        }
    }
    const probes = [
        [clear.x0, clear.y0],
        [clear.cx, clear.y0],
        [clear.x1, clear.y0],
        [clear.x1, clear.cy],
        [clear.x1, clear.y1],
        [clear.cx, clear.y1],
        [clear.x0, clear.y1],
        [clear.x0, clear.cy],
    ];
    for (const [qx, qy] of probes) {
        if (!ptInPoly(qx, qy, hole)) {
            throw new Error(`Scene ${sceneId} hole fails to enclose S=12 clear-box probe (${qx.toFixed(1)}, ${qy.toFixed(1)}) inside [${clear.x0.toFixed(0)}..${clear.x1.toFixed(0)}, ${clear.y0.toFixed(0)}..${clear.y1.toFixed(0)}]`);
        }
    }
}
