// Computer Vision optical telemetry overlays (World 01 · Leica Rangefinder Delicacy):
// Gossamer 0.68 px Swiss cinnabar bounding boxes, 8.5 px Geist Mono tags in whisper-frosted
// backing pills, 2.2 px fiducials with 5.2 px halos, and 0.65 px [2, 5] trajectory arcs.

import { PALETTE } from "./palette.ts";

const MONO = '"Geist Mono", ui-monospace, monospace';

export type TrackBoxOpts = {
  color?: string;
  labelColor?: string;
  label?: string;
  cornerBrackets?: boolean;
  labelBelow?: boolean;
  rot?: number; // rotation angle in radians around box center
  crosshair?: boolean;
  pillBg?: boolean;
};

/** Draws a whisper-subtle frosted-ink pill behind 8.5 px tabular telemetry coordinates. */
function drawTelemetryTag(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  baseline: "top" | "bottom" | "middle",
  color: string,
  showPill: boolean,
): void {
  ctx.save();
  ctx.font = `500 8.5px ${MONO}`;
  if ("fontVariantNumeric" in ctx) {
    (ctx as CanvasRenderingContext2D & { fontVariantNumeric: string }).fontVariantNumeric =
      "tabular-nums";
  }
  const tw = ctx.measureText(text).width;
  const padX = 4;
  const pillH = 12;
  const py =
    baseline === "bottom"
      ? y - pillH + 1
      : baseline === "top"
        ? y - 1
        : y - pillH * 0.5;

  if (showPill) {
    ctx.fillStyle = "rgba(8, 9, 11, 0.36)";
    ctx.beginPath();
    ctx.roundRect(x - padX, py, tw + padX * 2, pillH, 2.5);
    ctx.fill();
  }

  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, py + pillH * 0.52);
  ctx.restore();
}

/** Draws a delicate 0.68 px Leica-rangefinder CV box (axis-aligned or tangent-rotated). */
export function drawTrackBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: TrackBoxOpts = {},
): void {
  const color = opts.color ?? "rgba(217, 65, 43, 0.56)";
  const labelColor = opts.labelColor ?? "rgba(242, 239, 233, 0.78)";
  const cx = x + w / 2;
  const cy = y + h / 2;
  const label = opts.label ?? `x:${Math.round(cx)} y:${Math.round(cy)}`;
  const rot = opts.rot ?? 0;

  ctx.save();
  ctx.translate(cx, cy);
  if (rot) ctx.rotate(rot);

  const lx = -w / 2;
  const ly = -h / 2;
  const c = Math.min(9.5, w * 0.22, h * 0.22);

  ctx.strokeStyle = color;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";

  if (opts.cornerBrackets) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 0.55;
    ctx.strokeRect(lx + 0.5, ly + 0.5, w - 1, h - 1);
    ctx.restore();

    ctx.lineWidth = 0.88;
    ctx.beginPath();
    ctx.moveTo(lx, ly + c); ctx.lineTo(lx, ly); ctx.lineTo(lx + c, ly);
    ctx.moveTo(lx + w - c, ly); ctx.lineTo(lx + w, ly); ctx.lineTo(lx + w, ly + c);
    ctx.moveTo(lx + w, ly + h - c); ctx.lineTo(lx + w, ly + h); ctx.lineTo(lx + w - c, ly + h);
    ctx.moveTo(lx + c, ly + h); ctx.lineTo(lx, ly + h); ctx.lineTo(lx, ly + h - c);
    ctx.stroke();

    if (w >= 68 && h >= 48) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 0.68;
      ctx.beginPath();
      ctx.moveTo(0, ly); ctx.lineTo(0, ly + 2.5);
      ctx.moveTo(0, ly + h); ctx.lineTo(0, ly + h - 2.5);
      ctx.moveTo(lx, 0); ctx.lineTo(lx + 2.5, 0);
      ctx.moveTo(lx + w, 0); ctx.lineTo(lx + w - 2.5, 0);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    ctx.lineWidth = 0.68;
    ctx.strokeRect(lx + 0.5, ly + 0.5, w - 1, h - 1);

    const sc = Math.min(4.0, c);
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    ctx.moveTo(lx, ly + sc); ctx.lineTo(lx, ly); ctx.lineTo(lx + sc, ly);
    ctx.moveTo(lx + w - sc, ly); ctx.lineTo(lx + w, ly); ctx.lineTo(lx + w, ly + sc);
    ctx.moveTo(lx + w, ly + h - sc); ctx.lineTo(lx + w, ly + h); ctx.lineTo(lx + w - sc, ly + h);
    ctx.moveTo(lx + sc, ly + h); ctx.lineTo(lx, ly + h); ctx.lineTo(lx, ly + h - sc);
    ctx.stroke();
  }

  if (opts.crosshair !== false) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(-3.8, 0); ctx.lineTo(-1.4, 0);
    ctx.moveTo(1.4, 0);  ctx.lineTo(3.8, 0);
    ctx.moveTo(0, -3.8); ctx.lineTo(0, -1.4);
    ctx.moveTo(0, 1.4);  ctx.lineTo(0, 3.8);
    ctx.stroke();
    ctx.restore();
  }

  if (label.length > 0) {
    const tagY = opts.labelBelow ? ly + h + 4.5 : ly - 4.5;
    drawTelemetryTag(
      ctx,
      label,
      lx + 1,
      tagY,
      opts.labelBelow ? "top" : "bottom",
      labelColor,
      opts.pillBg ?? true,
    );
  }

  ctx.restore();
}

/** Draws a delicate 2.2 px CV fiducial core + 5.2 px gossamer 0.65 px halo ring. */
export function drawTrackPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string = PALETTE.cvRegistrationTick,
  labelColor = "rgba(242, 239, 233, 0.78)",
  label?: string,
): void {
  ctx.save();

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.38;
  ctx.lineWidth = 0.65;
  ctx.beginPath();
  ctx.arc(x, y, 5.2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.90;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 2.2, 0, Math.PI * 2);
  ctx.fill();

  const text = label ?? `x:${Math.round(x)} y:${Math.round(y)}`;
  ctx.globalAlpha = 1;
  drawTelemetryTag(ctx, text, x + 8.5, y, "middle", labelColor, true);

  ctx.restore();
}

/** Draws a gossamer 0.65 px [2, 5] dashed Bézier trajectory arc with a delicate micro-chevron. */
export function drawBezierLink(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  bow = -90,
  color = "rgba(242, 239, 233, 0.28)",
): void {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2 + bow;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 0.65;

  ctx.beginPath();
  ctx.arc(x0, y0, 1.25, 0, Math.PI * 2);
  ctx.moveTo(x1 + 1.25, y1);
  ctx.arc(x1, y1, 1.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.setLineDash([2, 5]);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx, my, x1, y1);
  ctx.stroke();

  const px = 0.25 * x0 + 0.5 * mx + 0.25 * x1;
  const py = 0.25 * y0 + 0.5 * my + 0.25 * y1;
  const ang = Math.atan2(y1 - y0, x1 - x0);
  ctx.setLineDash([]);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 0.75;
  ctx.translate(px, py);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-3.0, -2.2);
  ctx.lineTo(2.0, 0);
  ctx.lineTo(-3.0, 2.2);
  ctx.stroke();
  ctx.restore();
}

/** Draws a gossamer 0.65 px [2, 5] orbital scanner ellipse with delicate vernier ticks. */
export function drawOrbitalScan(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
  color = "rgba(242, 239, 233, 0.22)",
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 0.65;
  ctx.setLineDash([2, 5]);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(-rx - 2.8, 0); ctx.lineTo(-rx + 2.8, 0);
  ctx.moveTo(rx - 2.8, 0);  ctx.lineTo(rx + 2.8, 0);
  ctx.moveTo(0, -ry - 2.8); ctx.lineTo(0, -ry + 2.8);
  ctx.moveTo(0, ry - 2.8);  ctx.lineTo(0, ry + 2.8);
  ctx.stroke();

  const na = rot * 2.6 + 0.8;
  ctx.beginPath();
  ctx.arc(Math.cos(na) * rx, Math.sin(na) * ry, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
