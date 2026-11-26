// Locked closed-form geometry for all 6 C^1-continuous Merrow badge silhouettes.
//
// Coordinates live in badge-centered space:
//   - Viewbox (SVG Y-down): [-390..+390] x [-280..+280]  (780 x 560)
//   - Bake domain:          [-360..+360] x [-260..+260]  (720 x 520)
//   - WebGL2 Y-up:          y_gl = -y_svg
//
// Every silhouette consists strictly of straight line segments and circular arcs meeting
// with C^1 tangency, so parallel offset curves (outer Merrow edge, centerline, inner border)
// remain exact and match GLSL `evalMerrowGeom()` to 0.00 px.
export const VIEW_W = 780;
export const VIEW_H = 560;
export const BAKE_REF_W = 720;
export const BAKE_REF_H = 520;
export const MERROW_WIDTH = 15.5;
export const MERROW_HALF_W = MERROW_WIDTH * 0.5; // 7.75 px
export const SHAPE_ID = {
    rect: 0,
    circle: 1,
    shield: 2,
    hexagon: 3,
    capsule: 4,
    arch: 5,
};
// Exact locked constants mirrored bit-for-bit in patch/shader.ts:
export const RECT_HALF_X = 333.75;
export const RECT_HALF_Y = 201.75;
export const RECT_R = 45.0;
export const CIRCLE_R = 224.0;
export const SHIELD_W = 200.0;
export const SHIELD_Y_TOP_GL = 214.0; // SVG y = -214
export const SHIELD_R_TOP = 34.0;
export const SHIELD_Y_HIP_GL = 40.0; // SVG y = -40
export const SHIELD_Y_BOT_GL = -224.0; // SVG y = +224
export const SHIELD_R_BOT = 30.0;
export const SHIELD_Y_BC_GL = SHIELD_Y_BOT_GL + SHIELD_R_BOT; // -194.0
const SHIELD_DY = SHIELD_Y_HIP_GL - SHIELD_Y_BC_GL; // 234.0
export const SHIELD_R_FLANK = (SHIELD_W * SHIELD_W + SHIELD_DY * SHIELD_DY - SHIELD_R_BOT * SHIELD_R_BOT) /
    (2 * (SHIELD_W - SHIELD_R_BOT)); // 276.0470588235294
export const SHIELD_X_F = SHIELD_W - SHIELD_R_FLANK; // -76.0470588235294
export const HEX_R_OUTER = 252.0; // circumradius of unrounded flat-top hexagon
export const HEX_APOTHEM = HEX_R_OUTER * (Math.sqrt(3) * 0.5); // 218.23840175367855
export const HEX_R_CORNER = 36.0;
export const CAPSULE_HALF_STRAIGHT = 148.0;
export const CAPSULE_R = 178.0;
export const ARCH_W = 200.0;
export const ARCH_Y_CENTER_GL = 24.0; // SVG y = -24, apex at y_svg = -224
export const ARCH_Y_BOT_GL = -222.0; // SVG y = +222
export const ARCH_R_BOT = 36.0;
const fmt = (n) => {
    const r = Math.round(n * 100) / 100;
    return Object.is(r, -0) ? "0" : String(r);
};
/**
 * Generates an exact closed SVG `<path d="...">` (in Y-down SVG badge coordinates) for the
 * given badge silhouette offset outward by `delta` px (0 = Merrow centerline, +7.75 = outer edge,
 * -7.75 = inner edge, -22 = interior decorative border).
 */
export function shapeSvgPath(shape, delta = 0) {
    switch (shape) {
        case "rect": {
            const hx = RECT_HALF_X + delta;
            const hy = RECT_HALF_Y + delta;
            const r = Math.max(1, RECT_R + delta);
            const sx = hx - r;
            const sy = hy - r;
            return [
                `M ${fmt(-sx)} ${fmt(-hy)}`,
                `L ${fmt(sx)} ${fmt(-hy)}`,
                `A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(hx)} ${fmt(-sy)}`,
                `L ${fmt(hx)} ${fmt(sy)}`,
                `A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(sx)} ${fmt(hy)}`,
                `L ${fmt(-sx)} ${fmt(hy)}`,
                `A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(-hx)} ${fmt(sy)}`,
                `L ${fmt(-hx)} ${fmt(-sy)}`,
                `A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(-sx)} ${fmt(-hy)}`,
                "Z",
            ].join(" ");
        }
        case "circle": {
            const r = Math.max(1, CIRCLE_R + delta);
            return `M 0 ${fmt(-r)} A ${fmt(r)} ${fmt(r)} 0 1 1 0 ${fmt(r)} A ${fmt(r)} ${fmt(r)} 0 1 1 0 ${fmt(-r)} Z`;
        }
        case "shield": {
            const w = SHIELD_W + delta;
            const yTop = -(SHIELD_Y_TOP_GL + delta); // SVG Y-down
            const rTop = Math.max(1, SHIELD_R_TOP + delta);
            const xTc = SHIELD_W - SHIELD_R_TOP; // invariant center X
            const yTc = -(SHIELD_Y_TOP_GL - SHIELD_R_TOP); // invariant center Y
            const yHip = -SHIELD_Y_HIP_GL; // -40 in SVG
            const rFlank = Math.max(1, SHIELD_R_FLANK + delta);
            const rBot = Math.max(1, SHIELD_R_BOT + delta);
            const yBc = -SHIELD_Y_BC_GL; // +194 in SVG
            // Unit direction from flank center (SHIELD_X_F, yHip) to bottom tip center (0, yBc)
            const dx = 0 - SHIELD_X_F;
            const dy = yBc - yHip;
            const dLen = Math.hypot(dx, dy);
            const ux = dx / dLen;
            const uy = dy / dLen;
            // Exact C^1 tangency join points on right (+tx) and left (-tx)
            const tx = ux * rBot;
            const ty = yBc + uy * rBot;
            return [
                `M ${fmt(-xTc)} ${fmt(yTop)}`,
                `L ${fmt(xTc)} ${fmt(yTop)}`,
                `A ${fmt(rTop)} ${fmt(rTop)} 0 0 1 ${fmt(w)} ${fmt(yTc)}`,
                `L ${fmt(w)} ${fmt(yHip)}`,
                `A ${fmt(rFlank)} ${fmt(rFlank)} 0 0 1 ${fmt(tx)} ${fmt(ty)}`,
                `A ${fmt(rBot)} ${fmt(rBot)} 0 0 1 ${fmt(-tx)} ${fmt(ty)}`,
                `A ${fmt(rFlank)} ${fmt(rFlank)} 0 0 1 ${fmt(-w)} ${fmt(yHip)}`,
                `L ${fmt(-w)} ${fmt(yTc)}`,
                `A ${fmt(rTop)} ${fmt(rTop)} 0 0 1 ${fmt(-xTc)} ${fmt(yTop)}`,
                "Z",
            ].join(" ");
        }
        case "hexagon": {
            const aIn = HEX_APOTHEM - HEX_R_CORNER;
            const sHalf = aIn / Math.sqrt(3);
            const r = Math.max(1, HEX_R_CORNER + delta);
            const ap = aIn + r;
            // 6 flat-edge midpoints at clockwise angles k * 60 deg from 12 o'clock (0, -1) in SVG Y-down
            const segs = [];
            for (let k = 0; k < 6; k++) {
                const ang = (k * Math.PI) / 3;
                // Outward normal (nx, ny) and clockwise tangent (tx, ty) in SVG Y-down
                const nx = Math.sin(ang);
                const ny = -Math.cos(ang);
                const tx = Math.cos(ang);
                const ty = Math.sin(ang);
                const x0 = nx * ap - tx * sHalf;
                const y0 = ny * ap - ty * sHalf;
                const x1 = nx * ap + tx * sHalf;
                const y1 = ny * ap + ty * sHalf;
                if (k === 0)
                    segs.push(`M ${fmt(x0)} ${fmt(y0)}`);
                else
                    segs.push(`A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x0)} ${fmt(y0)}`);
                segs.push(`L ${fmt(x1)} ${fmt(y1)}`);
            }
            // Close final corner arc back to k=0 start
            const xStart = -sHalf;
            const yStart = -ap;
            segs.push(`A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(xStart)} ${fmt(yStart)} Z`);
            return segs.join(" ");
        }
        case "capsule": {
            const hs = CAPSULE_HALF_STRAIGHT;
            const r = Math.max(1, CAPSULE_R + delta);
            return [
                `M ${fmt(-hs)} ${fmt(-r)}`,
                `L ${fmt(hs)} ${fmt(-r)}`,
                `A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(hs)} ${fmt(r)}`,
                `L ${fmt(-hs)} ${fmt(r)}`,
                `A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(-hs)} ${fmt(-r)}`,
                "Z",
            ].join(" ");
        }
        case "arch": {
            const w = ARCH_W + delta;
            const yArch = -ARCH_Y_CENTER_GL; // -24 in SVG
            const yBot = -(ARCH_Y_BOT_GL - delta); // +222 + delta in SVG
            const rBot = Math.max(1, ARCH_R_BOT + delta);
            const xBc = ARCH_W - ARCH_R_BOT; // 164
            const yBc = -(ARCH_Y_BOT_GL + ARCH_R_BOT); // +186 in SVG
            return [
                `M ${fmt(-w)} ${fmt(yArch)}`,
                `A ${fmt(w)} ${fmt(w)} 0 0 1 ${fmt(w)} ${fmt(yArch)}`,
                `L ${fmt(w)} ${fmt(yBc)}`,
                `A ${fmt(rBot)} ${fmt(rBot)} 0 0 1 ${fmt(xBc)} ${fmt(yBot)}`,
                `L ${fmt(-xBc)} ${fmt(yBot)}`,
                `A ${fmt(rBot)} ${fmt(rBot)} 0 0 1 ${fmt(-w)} ${fmt(yBc)}`,
                "Z",
            ].join(" ");
        }
    }
}
/** Bounding box of outer Merrow edge in SVG coordinates (for drafting guides & crop marks). */
export function shapeOuterBounds(shape) {
    const d = MERROW_HALF_W;
    switch (shape) {
        case "rect":
            return { hw: RECT_HALF_X + d, top: -(RECT_HALF_Y + d), bot: RECT_HALF_Y + d };
        case "circle":
            return { hw: CIRCLE_R + d, top: -(CIRCLE_R + d), bot: CIRCLE_R + d };
        case "shield":
            return { hw: SHIELD_W + d, top: -(SHIELD_Y_TOP_GL + d), bot: -SHIELD_Y_BOT_GL + d };
        case "hexagon":
            return { hw: HEX_R_OUTER + d, top: -(HEX_APOTHEM + d), bot: HEX_APOTHEM + d };
        case "capsule":
            return { hw: CAPSULE_HALF_STRAIGHT + CAPSULE_R + d, top: -(CAPSULE_R + d), bot: CAPSULE_R + d };
        case "arch":
            return { hw: ARCH_W + d, top: -(ARCH_Y_CENTER_GL + ARCH_W + d), bot: -ARCH_Y_BOT_GL + d };
    }
}
