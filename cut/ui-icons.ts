// Precision hairline UI icon library (24x24 optical grid) and World-01 harmonized
// continuous-superellipse (`G2`, n=4.4) studio hardware tiles (`Silver Gelatin & Cinnabar`).
// Zero runtime dependencies; pure subpixel-balanced Canvas2D paths.

import { PALETTE } from "./palette.ts";

export type UiIconName =
  // Builder & IDE icons
  | "paperclip"
  | "sparkles"
  | "globe"
  | "layers"
  | "cpu"
  | "mic"
  | "arrowUp"
  | "chevronDown"
  | "plus"
  | "sliders"
  | "search"
  | "code"
  // Social & profile icons
  | "arrowLeft"
  | "bell"
  | "verified"
  | "comment"
  | "repost"
  | "heart"
  | "chart"
  | "share"
  | "play"
  | "bookmark"
  | "dots";

export type StudioMark =
  | "vectra"
  | "solis"
  | "delineate"
  | "kinetix"
  | "monolith"
  | "aperture";

/** Reference tile size (px) corresponding to `sc = 1.0` in `drawStudioGlyph`. */
export const STUDIO_GLYPH_BASE = 232;

/**
 * Traces a continuous G2 superellipse (`|x/r|^n + |y/r|^n = 1`, `n = 4.4`) centered at `(cx, cy)`
 * with half-extent `r`. Eliminates the harsh G1 Mach-band corner kink of circular `roundRect`.
 */
export function traceSuperellipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  exp = 4.4,
  steps = 64,
): void {
  const p = 2 / exp;
  ctx.beginPath();
  for (let i = 0; i < steps; i++) {
    const a = (i * Math.PI * 2) / steps;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const x = cx + Math.sign(ca) * Math.pow(Math.abs(ca), p) * r;
    const y = cy + Math.sign(sa) * Math.pow(Math.abs(sa), p) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Draws a concave 4-point astroid star subpath centered at `(cx, cy)` with outer radius `r`. */
function traceAstroidStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  waist = 0.20,
): void {
  const k = r * waist;
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + k, cy - k, cx + r, cy);
  ctx.quadraticCurveTo(cx + k, cy + k, cx, cy + r);
  ctx.quadraticCurveTo(cx - k, cy + k, cx - r, cy);
  ctx.quadraticCurveTo(cx - k, cy - k, cx, cy - r);
  ctx.closePath();
}

/**
 * Renders a Linear / SF-Symbols-caliber hairline UI icon centered at `(cx, cy)` with bounding
 * box `size × size`. Internally normalized on a `[-12..+12]` (`24 × 24`) optical grid.
 */
export function drawUiIcon(
  ctx: CanvasRenderingContext2D,
  name: UiIconName,
  cx: number,
  cy: number,
  size: number,
  color: string,
  strokeWidth?: number,
): void {
  if (size <= 0) return;
  const s = size / 24;
  const lwPx = strokeWidth ?? Math.max(1.15, size * 0.078);
  const lw = lwPx / s;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (name) {
    case "paperclip": {
      ctx.save();
      ctx.rotate(-Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(4.8, -2.2);
      ctx.lineTo(4.8, 4.6);
      ctx.arc(0, 4.6, 4.8, 0, Math.PI, false);
      ctx.lineTo(-4.8, -5.2);
      ctx.arc(-1.6, -5.2, 3.2, Math.PI, 0, false);
      ctx.lineTo(1.6, 4.2);
      ctx.arc(0, 4.2, 1.6, 0, Math.PI, false);
      ctx.lineTo(-1.6, -2.6);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case "sparkles": {
      ctx.beginPath();
      traceAstroidStar(ctx, -1.6, 1.2, 8.2, 0.21);
      traceAstroidStar(ctx, 6.8, -6.4, 3.6, 0.24);
      ctx.fill();
      break;
    }

    case "globe": {
      ctx.beginPath();
      ctx.arc(0, 0, 9.0, 0, Math.PI * 2);
      ctx.moveTo(-9.0, 0);
      ctx.lineTo(9.0, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, 4.1, 9.0, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case "layers": {
      ctx.beginPath();
      ctx.moveTo(0, -8.4);
      ctx.lineTo(9.2, -3.6);
      ctx.lineTo(0, 1.2);
      ctx.lineTo(-9.2, -3.6);
      ctx.closePath();
      ctx.moveTo(-9.2, 1.0);
      ctx.lineTo(0, 5.8);
      ctx.lineTo(9.2, 1.0);
      ctx.moveTo(-9.2, 5.4);
      ctx.lineTo(0, 10.2);
      ctx.lineTo(9.2, 5.4);
      ctx.stroke();
      break;
    }

    case "cpu": {
      ctx.beginPath();
      ctx.roundRect(-6.2, -6.2, 12.4, 12.4, 2.4);
      ctx.roundRect(-2.5, -2.5, 5.0, 5.0, 0.9);
      for (const o of [-2.8, 2.8]) {
        ctx.moveTo(o, -9.4); ctx.lineTo(o, -6.2);
        ctx.moveTo(o, 6.2);  ctx.lineTo(o, 9.4);
        ctx.moveTo(-9.4, o); ctx.lineTo(-6.2, o);
        ctx.moveTo(6.2, o);  ctx.lineTo(9.4, o);
      }
      ctx.stroke();
      break;
    }

    case "mic": {
      ctx.beginPath();
      ctx.roundRect(-3.2, -9.4, 6.4, 10.6, 3.2);
      ctx.moveTo(-6.6, -1.8);
      ctx.arc(0, -1.8, 6.6, Math.PI, 0, true);
      ctx.moveTo(0, 4.8);
      ctx.lineTo(0, 9.2);
      ctx.moveTo(-3.8, 9.2);
      ctx.lineTo(3.8, 9.2);
      ctx.stroke();
      break;
    }

    case "arrowUp": {
      ctx.beginPath();
      ctx.moveTo(0, 8.0);
      ctx.lineTo(0, -7.8);
      ctx.moveTo(-5.8, -2.0);
      ctx.lineTo(0, -7.8);
      ctx.lineTo(5.8, -2.0);
      ctx.stroke();
      break;
    }

    case "chevronDown": {
      ctx.beginPath();
      ctx.moveTo(-6.0, -2.4);
      ctx.lineTo(0, 3.6);
      ctx.lineTo(6.0, -2.4);
      ctx.stroke();
      break;
    }

    case "plus": {
      ctx.beginPath();
      ctx.moveTo(-7.2, 0);
      ctx.lineTo(7.2, 0);
      ctx.moveTo(0, -7.2);
      ctx.lineTo(0, 7.2);
      ctx.stroke();
      break;
    }

    case "sliders": {
      const rows: Array<[number, number]> = [
        [-5.8, -2.8],
        [0, 3.4],
        [5.8, -1.8],
      ];
      const rKnob = 2.2;
      ctx.beginPath();
      for (const [ry, kx] of rows) {
        if (kx - rKnob > -8.8) {
          ctx.moveTo(-8.8, ry);
          ctx.lineTo(kx - rKnob, ry);
        }
        if (kx + rKnob < 8.8) {
          ctx.moveTo(kx + rKnob, ry);
          ctx.lineTo(8.8, ry);
        }
        ctx.moveTo(kx + rKnob, ry);
        ctx.arc(kx, ry, rKnob, 0, Math.PI * 2);
      }
      ctx.stroke();
      break;
    }

    case "search": {
      ctx.beginPath();
      ctx.arc(-1.6, -1.6, 6.2, 0, Math.PI * 2);
      ctx.moveTo(2.9, 2.9);
      ctx.lineTo(8.6, 8.6);
      ctx.stroke();
      break;
    }

    case "code": {
      ctx.beginPath();
      ctx.moveTo(-4.4, -5.4);
      ctx.lineTo(-9.6, 0);
      ctx.lineTo(-4.4, 5.4);
      ctx.moveTo(4.4, -5.4);
      ctx.lineTo(9.6, 0);
      ctx.lineTo(4.4, 5.4);
      ctx.moveTo(1.9, -7.4);
      ctx.lineTo(-1.9, 7.4);
      ctx.stroke();
      break;
    }

    case "arrowLeft": {
      ctx.beginPath();
      ctx.moveTo(8.0, 0);
      ctx.lineTo(-7.8, 0);
      ctx.moveTo(-2.0, -5.8);
      ctx.lineTo(-7.8, 0);
      ctx.lineTo(-2.0, 5.8);
      ctx.stroke();
      break;
    }

    case "bell": {
      ctx.beginPath();
      ctx.moveTo(0, -9.2);
      ctx.lineTo(0, -7.8);
      ctx.moveTo(-5.8, -2.0);
      ctx.arc(0, -2.0, 5.8, Math.PI, 0, false);
      ctx.bezierCurveTo(5.8, 1.8, 7.6, 3.8, 8.2, 5.0);
      ctx.lineTo(-8.2, 5.0);
      ctx.bezierCurveTo(-7.6, 3.8, -5.8, 1.8, -5.8, -2.0);
      ctx.moveTo(-2.3, 5.4);
      ctx.arc(0, 5.4, 2.3, 0, Math.PI, false);
      ctx.stroke();
      break;
    }

    case "verified": {
      ctx.beginPath();
      const lobes = 8;
      const samples = 64;
      for (let i = 0; i < samples; i++) {
        const a = (i * Math.PI * 2) / samples;
        const rad = 9.2 + 1.15 * Math.cos(a * lobes);
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      const checkPts: Array<[number, number]> = [
        [-4.5, 0.3],
        [-3.1, -1.1],
        [-1.0, 1.0],
        [3.3, -3.4],
        [4.8, -1.9],
        [-1.0, 3.9],
      ];
      for (let i = checkPts.length - 1; i >= 0; i--) {
        const [px, py] = checkPts[i];
        if (i === checkPts.length - 1) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill("evenodd");
      break;
    }

    case "comment": {
      ctx.beginPath();
      ctx.moveTo(-4.7, 5.5);
      ctx.lineTo(-8.2, 8.4);
      ctx.lineTo(-6.8, 4.1);
      ctx.ellipse(0, -0.6, 8.8, 7.2, 0, Math.PI * 0.79, Math.PI * 2.68, false);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case "repost": {
      ctx.beginPath();
      ctx.moveTo(-6.8, -0.8);
      ctx.lineTo(-6.8, -5.2);
      ctx.lineTo(6.8, -5.2);
      ctx.moveTo(3.6, -8.2);
      ctx.lineTo(6.8, -5.2);
      ctx.lineTo(3.6, -2.2);
      ctx.moveTo(6.8, 0.8);
      ctx.lineTo(6.8, 5.2);
      ctx.lineTo(-6.8, 5.2);
      ctx.moveTo(-3.6, 2.2);
      ctx.lineTo(-6.8, 5.2);
      ctx.lineTo(-3.6, 8.2);
      ctx.stroke();
      break;
    }

    case "heart": {
      ctx.beginPath();
      ctx.moveTo(0, 8.2);
      ctx.bezierCurveTo(-1.8, 6.8, -9.0, 2.2, -9.0, -3.0);
      ctx.bezierCurveTo(-9.0, -6.6, -6.2, -8.6, -3.4, -8.6);
      ctx.bezierCurveTo(-1.4, -8.6, -0.4, -7.4, 0, -6.2);
      ctx.bezierCurveTo(0.4, -7.4, 1.4, -8.6, 3.4, -8.6);
      ctx.bezierCurveTo(6.2, -8.6, 9.0, -6.6, 9.0, -3.0);
      ctx.bezierCurveTo(9.0, 2.2, 1.8, 6.8, 0, 8.2);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case "chart": {
      ctx.beginPath();
      ctx.moveTo(-5.8, 8.0); ctx.lineTo(-5.8, 1.8);
      ctx.moveTo(0, 8.0);    ctx.lineTo(0, -7.6);
      ctx.moveTo(5.8, 8.0);  ctx.lineTo(5.8, -2.8);
      ctx.stroke();
      break;
    }

    case "share": {
      ctx.beginPath();
      ctx.moveTo(-7.2, 1.6);
      ctx.lineTo(-7.2, 8.2);
      ctx.lineTo(7.2, 8.2);
      ctx.lineTo(7.2, 1.6);
      ctx.moveTo(0, 3.4);
      ctx.lineTo(0, -8.2);
      ctx.moveTo(-4.4, -3.8);
      ctx.lineTo(0, -8.2);
      ctx.lineTo(4.4, -3.8);
      ctx.stroke();
      break;
    }

    case "play": {
      ctx.lineWidth = Math.min(2.0, lw);
      ctx.beginPath();
      ctx.moveTo(-4.8, -6.8);
      ctx.lineTo(7.2, 0);
      ctx.lineTo(-4.8, 6.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case "bookmark": {
      ctx.beginPath();
      ctx.moveTo(-6.0, 8.6);
      ctx.lineTo(-6.0, -6.8);
      ctx.arcTo(-6.0, -8.6, -4.2, -8.6, 1.8);
      ctx.lineTo(4.2, -8.6);
      ctx.arcTo(6.0, -8.6, 6.0, -6.8, 1.8);
      ctx.lineTo(6.0, 8.6);
      ctx.lineTo(0, 4.2);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case "dots": {
      ctx.beginPath();
      for (const ox of [-5.8, 0, 5.8]) {
        ctx.moveTo(ox + 1.4, 0);
        ctx.arc(ox, 0, 1.4, 0, Math.PI * 2);
      }
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

/**
 * Renders one of the 6 bespoke studio monograms harmonized to World 01 (`Silver Gelatin & Cinnabar`).
 * Scale `sc = 1.0` matches a `232px` macro squircle (`sc = size / STUDIO_GLYPH_BASE`).
 * Automatically opens micro-counters below `sc < 0.16` (`< 36px`). `delineate` stays locked to `R3-03`.
 */
export function drawStudioGlyph(
  ctx: CanvasRenderingContext2D,
  mark: StudioMark,
  sc: number,
): void {
  if (sc <= 0) return;
  const micro = sc < 0.16;

  ctx.save();
  ctx.scale(sc, sc);

  switch (mark) {
    case "vectra": {
      // Brushed selenium-obsidian + bone & platinum-silver geometric V
      const slit = micro ? 7.0 : 5.0;
      ctx.fillStyle = PALETTE.inkLight;
      ctx.beginPath();
      ctx.moveTo(-61, -46);
      ctx.lineTo(-30, -46);
      ctx.lineTo(-slit, 10);
      ctx.lineTo(-slit, 63);
      ctx.closePath();
      ctx.fill();

      const tg = ctx.createLinearGradient(0, -62, 58, 62);
      tg.addColorStop(0, "#E2E0D8");
      tg.addColorStop(1, "#8A919E");
      ctx.fillStyle = micro ? "#B8B7B0" : tg;
      ctx.beginPath();
      ctx.moveTo(slit, 63);
      ctx.lineTo(61, -46);
      ctx.lineTo(31, -61);
      ctx.lineTo(-24, -61);
      ctx.lineTo(-11, -34);
      ctx.lineTo(24, -34);
      ctx.lineTo(slit, 5);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "solis": {
      // Warm champagne-to-amber metallic sun-horizon (#F4EFE2 -> #D6CFAF -> #A68D64)
      const g = ctx.createLinearGradient(-48, -58, 48, 8);
      g.addColorStop(0, "#F4EFE2");
      g.addColorStop(0.54, "#D6CFAF");
      g.addColorStop(1, "#A68D64");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, micro ? -6 : -4, 56, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#D6CFAF";
      ctx.beginPath();
      ctx.roundRect(-48, micro ? 12 : 10, 96, micro ? 17 : 15, 7.5);
      ctx.fill();

      ctx.fillStyle = "#7D7567";
      ctx.beginPath();
      ctx.roundRect(-28, micro ? 38 : 34, 56, micro ? 15 : 14, 7);
      ctx.fill();
      break;
    }

    case "delineate": {
      // LOCKED R3-03 SHEARED DIRECTOR'S GATE (`16:9 -> d`: 19.5u bars, 9.5u toe, 5.60u -24° splice)
      ctx.save();
      ctx.scale(1.36, 1.36);
      ctx.translate(2, 3);
      ctx.transform(1, 0, -0.085, 1, 0, 0);
      ctx.fillStyle = PALETTE.inkDark;

      ctx.beginPath();
      ctx.moveTo(-39.0, -17.6);
      ctx.lineTo(8.4, -17.6);
      ctx.lineTo(8.4, 1.9);
      ctx.lineTo(-20.0, 1.9);
      ctx.lineTo(-20.0, 16.5);
      ctx.lineTo(-39.0, 24.96);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(14.0, -41.5);
      ctx.lineTo(33.5, -50.2);
      ctx.lineTo(33.5, 40.6);
      ctx.lineTo(-39.0, 40.6);
      ctx.lineTo(-39.0, 31.09);
      ctx.lineTo(-16.56, 21.1);
      ctx.lineTo(14.0, 21.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }

    case "kinetix": {
      // Anodized graphite-slate + crisp bone rail + brushed platinum chevron + champagne sphere
      ctx.fillStyle = PALETTE.inkLight;
      ctx.beginPath();
      ctx.roundRect(-56, -54, 23, 108, 4.5);
      ctx.fill();

      const gap = micro ? 7.0 : 5.0;
      ctx.fillStyle = "#C9CED6";
      ctx.beginPath();
      ctx.moveTo(-22, -gap);
      ctx.lineTo(25, -54);
      ctx.lineTo(54, -54);
      ctx.lineTo(7, -gap);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#8C96A5";
      ctx.beginPath();
      ctx.moveTo(-22, gap);
      ctx.lineTo(7, gap);
      ctx.lineTo(54, 54);
      ctx.lineTo(25, 54);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = PALETTE.primaryAccent;
      ctx.beginPath();
      ctx.arc(43, 0, micro ? 14.5 : 12.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "monolith": {
      // Matte pearl-alabaster tile + deep obsidian & brushed slate Albers-Kubrick arch
      const g1 = ctx.createLinearGradient(-62, -62, 62, 62);
      g1.addColorStop(0, "#2B323D");
      g1.addColorStop(1, "#121418");
      ctx.fillStyle = g1;
      traceSuperellipse(ctx, 0, 0, 62, 4.2, 48);
      ctx.fill();

      const g2 = ctx.createLinearGradient(-34, -30, 48, 56);
      g2.addColorStop(0, "#6E7887");
      g2.addColorStop(1, "#D6CFAF");
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.roundRect(-37, -27, 85, 83, 16);
      ctx.fill();

      ctx.fillStyle = PALETTE.obsidianVoid;
      ctx.beginPath();
      ctx.roundRect(-9, -7, 36, 63, 5);
      ctx.fill();
      break;
    }

    case "aperture": {
      // Leica darkroom anodized cinnabar (#C83D28) + bone iris + champagne core
      ctx.fillStyle = PALETTE.paperLight;
      ctx.beginPath();
      ctx.arc(0, 0, 58, 0, Math.PI * 2, false);
      ctx.moveTo(44, -11);
      ctx.arc(13, -11, 31, 0, Math.PI * 2, true);
      ctx.fill("evenodd");

      ctx.fillStyle = PALETTE.primaryAccent;
      ctx.beginPath();
      ctx.arc(4, -3, micro ? 14.5 : 12.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

type MaterialSpec = {
  top: string;
  mid: string;
  bot: string;
  keyGlow: string;
  lightSurface: boolean;
};

const TILE_MATERIALS: Record<StudioMark, MaterialSpec> = {
  // Brushed selenium-obsidian
  vectra: {
    top: "#1B1E25",
    mid: "#121418",
    bot: "#090A0D",
    keyGlow: "rgba(226, 224, 216, 0.12)",
    lightSurface: false,
  },
  // Deep darkroom charcoal with warm champagne sheen
  solis: {
    top: "#1C1B1E",
    mid: "#121214",
    bot: "#08080A",
    keyGlow: "rgba(214, 207, 175, 0.13)",
    lightSurface: false,
  },
  // Warm archival cotton rag (#F6F5F0)
  delineate: {
    top: "#FAF9F5",
    mid: "#F6F5F0",
    bot: "#E4E1D8",
    keyGlow: "rgba(255, 255, 255, 0.72)",
    lightSurface: true,
  },
  // Anodized graphite-slate
  kinetix: {
    top: "#20242B",
    mid: "#171A1F",
    bot: "#0C0E12",
    keyGlow: "rgba(200, 211, 230, 0.13)",
    lightSurface: false,
  },
  // Matte pearl-alabaster (#EAE7DF)
  monolith: {
    top: "#F4F2EB",
    mid: "#EAE7DF",
    bot: "#D6D2C7",
    keyGlow: "rgba(255, 255, 255, 0.78)",
    lightSurface: true,
  },
  // Leica darkroom anodized Swiss cinnabar (#C83D28 — the single 2% cinnabar hero tile)
  aperture: {
    top: "#D94933",
    mid: "#C83D28",
    bot: "#982A1A",
    keyGlow: "rgba(246, 245, 240, 0.18)",
    lightSurface: false,
  },
};

/**
 * Renders a complete World-01 continuous-superellipse (`G2`) hardware tile at `(x, y)` of `size`:
 * multi-stop mineral/anodized surface, off-axis studio keylight, recessed keycap bevel,
 * subpixel-balanced monogram, and delicate 0.85 px top-edge specular rim.
 */
export function drawStudioTile(
  ctx: CanvasRenderingContext2D,
  mark: StudioMark,
  x: number,
  y: number,
  size: number,
  lightFrame = false,
): void {
  if (size <= 0) return;
  const mat = TILE_MATERIALS[mark];
  const r = size * 0.5;
  const cx = x + r;
  const cy = y + r;
  const macro = size >= 64;

  ctx.save();

  if (size >= 22) {
    ctx.save();
    traceSuperellipse(ctx, cx, cy, r, 4.4, macro ? 64 : 40);
    ctx.shadowColor = lightFrame
      ? "rgba(22, 22, 21, 0.16)"
      : "rgba(0, 0, 0, 0.54)";
    ctx.shadowBlur = Math.min(38, size * 0.16);
    ctx.shadowOffsetY = Math.min(14, size * 0.048);
    ctx.fillStyle = mat.mid;
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  traceSuperellipse(ctx, cx, cy, r, 4.4, macro ? 64 : 40);
  ctx.clip();

  const bg = ctx.createLinearGradient(cx, y, cx, y + size);
  bg.addColorStop(0, mat.top);
  bg.addColorStop(0.54, mat.mid);
  bg.addColorStop(1, mat.bot);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, size, size);

  const kg = ctx.createRadialGradient(
    x + size * 0.28,
    y + size * 0.16,
    size * 0.04,
    x + size * 0.35,
    y + size * 0.28,
    size * 0.82,
  );
  kg.addColorStop(0, mat.keyGlow);
  kg.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = kg;
  ctx.fillRect(x, y, size, size);

  if (macro) {
    const bevH = Math.max(4, size * 0.05);
    const bGrad = ctx.createLinearGradient(cx, y + size - bevH, cx, y + size);
    bGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    bGrad.addColorStop(
      1,
      mat.lightSurface ? "rgba(22, 22, 21, 0.09)" : "rgba(0, 0, 0, 0.34)",
    );
    ctx.fillStyle = bGrad;
    ctx.fillRect(x, y + size - bevH, size, bevH);
  }

  ctx.save();
  ctx.translate(cx, cy);
  if (macro && mark !== "delineate") {
    ctx.shadowColor = mat.lightSurface
      ? "rgba(22, 22, 21, 0.12)"
      : "rgba(0, 0, 0, 0.36)";
    ctx.shadowBlur = size * 0.03;
    ctx.shadowOffsetY = size * 0.01;
  }
  drawStudioGlyph(ctx, mark, size / STUDIO_GLYPH_BASE);
  ctx.restore();

  ctx.restore();

  const inset = size >= 40 ? 0.6 : 0.45;
  traceSuperellipse(ctx, cx, cy, Math.max(1, r - inset), 4.4, macro ? 64 : 40);
  const rim = ctx.createLinearGradient(cx, y, cx, y + size);
  if (mat.lightSurface) {
    rim.addColorStop(0, lightFrame ? "rgba(22, 22, 21, 0.12)" : "rgba(255, 255, 255, 0.86)");
    rim.addColorStop(0.45, lightFrame ? "rgba(22, 22, 21, 0.08)" : "rgba(242, 239, 233, 0.24)");
    rim.addColorStop(1, "rgba(22, 22, 21, 0.18)");
  } else {
    rim.addColorStop(0, "rgba(242, 239, 233, 0.30)");
    rim.addColorStop(0.38, "rgba(242, 239, 233, 0.09)");
    rim.addColorStop(1, lightFrame ? "rgba(22, 22, 21, 0.24)" : "rgba(242, 239, 233, 0.04)");
  }
  ctx.strokeStyle = rim;
  ctx.lineWidth = size >= 120 ? 1.15 : 0.80;
  ctx.stroke();

  ctx.restore();
}
