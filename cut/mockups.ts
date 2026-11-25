// World 01 · Silver Gelatin & Cinnabar UI & Cinema Mockups (`S03`, `S04`, `S07`, `S10c`):
// - Every photographic plate graded once via `getGradedPlate` (Leica selenium/champagne split-tone)
// - Macro eye graded via `getGradedEye` (strict 3-value mineral anatomy)
// - Razor-thin 0.75 px specular glass borders, G2 superellipse studio tiles, SF-Symbols hairlines,
//   and Turrell 38° diagonal optical light-blade preview (zero neon clash, zero rocket flames).

import { PALETTE, getGradedEye, getGradedPlate } from "./palette.ts";
import {
  drawStudioTile,
  drawUiIcon,
  traceSuperellipse,
  type StudioMark,
  type UiIconName,
} from "./ui-icons.ts";

const SANS = '"Switzer", -apple-system, BlinkMacSystemFont, sans-serif';
const MONO = '"Geist Mono", ui-monospace, monospace';

export type MockupMedia = {
  eye: HTMLImageElement | null;
  rocket: HTMLImageElement | null;
  plates: Record<string, HTMLImageElement | null>;
};

export type BuilderShotSpec = {
  lightCard: boolean;
  perspX: number;
  perspY: number;
  roll: number;
  zoom: number;
  anchorUvX: number;
  anchorUvY: number;
};

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws a cached LUT-graded `HTMLCanvasElement` (or fallback `HTMLImageElement`) in cover-fit. */
function drawCoverCanvasOrImage(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement | HTMLImageElement | null | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  zoom = 1.0,
  panX = 0.0,
  panY = 0.0,
): boolean {
  if (!src) return false;
  const sw = src instanceof HTMLCanvasElement ? src.width : src.naturalWidth;
  const sh = src instanceof HTMLCanvasElement ? src.height : src.naturalHeight;
  if (sw <= 0 || sh <= 0) return false;

  const scale = Math.max(w / sw, h / sh) * zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(
    src,
    x + (w - dw) * 0.5 + panX * w,
    y + (h - dh) * 0.5 + panY * h,
    dw,
    dh,
  );
  ctx.restore();
  return true;
}

/** Razor-thin 0.75 px architectural glass hairline with delicate top-edge specular light catch. */
function strokeGlassRim(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  lightSurface: boolean,
): void {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  if (lightSurface) {
    g.addColorStop(0, "rgba(255, 255, 255, 0.90)");
    g.addColorStop(0.45, "rgba(255, 255, 255, 0.34)");
    g.addColorStop(1, "rgba(22, 22, 21, 0.11)");
  } else {
    g.addColorStop(0, "rgba(242, 239, 233, 0.18)");
    g.addColorStop(0.38, "rgba(242, 239, 233, 0.07)");
    g.addColorStop(1, "rgba(242, 239, 233, 0.025)");
  }
  roundRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, Math.max(1, r - 0.5));
  ctx.strokeStyle = g;
  ctx.lineWidth = 0.75;
  ctx.stroke();
}

// ============================================================================
// SCENE 03 ("Everyone can build a SaaS"): 8 World-01 AI SaaS Builder Worlds
// Coplanar prompt card + text locked strictly at `(W * 0.24, H * 0.485)`
// ============================================================================
export function drawBuilderBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  variant: number,
  typedText: string,
  showCursor: boolean,
  media?: MockupMedia,
): BuilderShotSpec {
  type BuilderTheme = {
    plate: string;
    plateZoom: number;
    platePanX: number;
    platePanY: number;
    fb0: string;
    fb1: string;
    scrimTop: string;
    scrimBot: string;
    brand: StudioMark;
    brandLabel: string;
    lightBg: boolean;
    headline: string;
    sub: string;
    headX: number;
    headY: number;
    boxW: number;
    boxH: number;
    cardTop: string;
    cardBot: string;
    ink: string;
    muted: string;
    accentFill: string;
    accentArrow: string;
    caretCol: string;
    modelTag: string;
    lightCard: boolean;
    perspX: number;
    perspY: number;
    roll: number;
    zoom: number;
    chips: Array<{ label: string; icon: UiIconName }>;
    botPills?: Array<{ label: string; icon: UiIconName }>;
  };

  const themes: BuilderTheme[] = [
    // 0: Warm archival rag daylight (`s03Daylight` graded) + crisp cotton-paper prompt card
    {
      plate: "s03Daylight",
      plateZoom: 1.06,
      platePanX: 0.04,
      platePanY: 0.0,
      fb0: "#EAE7DF",
      fb1: "#D8D4C9",
      scrimTop: "rgba(246, 245, 240, 0.62)",
      scrimBot: "rgba(228, 225, 216, 0.42)",
      brand: "delineate",
      brandLabel: "delineate",
      lightBg: true,
      headline: "Turn your ideas into a SaaS",
      sub: "Full-stack architecture, billing, and edge deployment from plain words.",
      headX: 0.58,
      headY: 0.17,
      boxW: 0.68,
      boxH: 156,
      cardTop: "rgba(251, 250, 246, 0.96)",
      cardBot: "rgba(243, 241, 234, 0.94)",
      ink: PALETTE.inkDark,
      muted: "rgba(22, 22, 21, 0.58)",
      accentFill: PALETTE.inkDark,
      accentArrow: PALETTE.paperLight,
      caretCol: PALETTE.cvRegistrationTick,
      modelTag: "Studio 4.6",
      lightCard: true,
      perspX: 0.26,
      perspY: -0.13,
      roll: 0.042,
      zoom: 1.25,
      chips: [
        { label: "Schema", icon: "layers" },
        { label: "Auth + Billing", icon: "globe" },
        { label: "Deploy", icon: "sparkles" },
      ],
    },
    // 1: Fluted silver-champagne blown glass (`s03Aurora` graded) + selenium-obsidian card
    {
      plate: "s03Aurora",
      plateZoom: 1.05,
      platePanX: 0.0,
      platePanY: 0.0,
      fb0: "#1B1E24",
      fb1: "#0B0D11",
      scrimTop: "rgba(8, 9, 11, 0.38)",
      scrimBot: "rgba(8, 9, 11, 0.64)",
      brand: "solis",
      brandLabel: "Solis",
      lightBg: false,
      headline: "Ship living software in minutes",
      sub: "Realtime databases, bespoke interfaces, and instant global edge.",
      headX: 0.48,
      headY: 0.20,
      boxW: 0.66,
      boxH: 152,
      cardTop: "rgba(21, 23, 28, 0.94)",
      cardBot: "rgba(13, 14, 18, 0.96)",
      ink: PALETTE.inkLight,
      muted: "rgba(242, 239, 233, 0.64)",
      accentFill: PALETTE.primaryAccent,
      accentArrow: PALETTE.inkDark,
      caretCol: PALETTE.primaryAccent,
      modelTag: "Solis Pro",
      lightCard: false,
      perspX: -0.24,
      perspY: -0.11,
      roll: 0.036,
      zoom: 1.26,
      chips: [
        { label: "Workflows", icon: "sparkles" },
        { label: "Postgres", icon: "layers" },
        { label: "Domain", icon: "globe" },
      ],
    },
    // 2: Smoked architectural slate (`s03Dusk` graded) + graphite IDE card
    {
      plate: "s03Dusk",
      plateZoom: 1.08,
      platePanX: 0.0,
      platePanY: 0.02,
      fb0: "#141619",
      fb1: "#08090B",
      scrimTop: "rgba(8, 9, 11, 0.46)",
      scrimBot: "rgba(8, 9, 11, 0.70)",
      brand: "vectra",
      brandLabel: "Vectra",
      lightBg: false,
      headline: "What will you launch today?",
      sub: "Spatial canvas · zero-latency preview · strict TypeScript",
      headX: 0.62,
      headY: 0.24,
      boxW: 0.71,
      boxH: 148,
      cardTop: "rgba(24, 26, 31, 0.95)",
      cardBot: "rgba(15, 17, 21, 0.96)",
      ink: PALETTE.inkLight,
      muted: "rgba(242, 239, 233, 0.58)",
      accentFill: PALETTE.inkLight,
      accentArrow: PALETTE.inkDark,
      caretCol: PALETTE.primaryAccent,
      modelTag: "Carbon 4.6",
      lightCard: false,
      perspX: 0.25,
      perspY: 0.11,
      roll: -0.028,
      zoom: 1.28,
      chips: [
        { label: "Search", icon: "search" },
        { label: "Reason", icon: "cpu" },
        { label: "Code", icon: "code" },
      ],
      botPills: [
        { label: "SaaS Starter", icon: "sparkles" },
        { label: "Data Model", icon: "layers" },
        { label: "API Routes", icon: "sliders" },
        { label: "Audit", icon: "code" },
      ],
    },
    // 3: Blossom courtyard in silver-champagne (`s03Daylight` wide crop) + crisp rag card
    {
      plate: "s03Daylight",
      plateZoom: 1.14,
      platePanX: -0.04,
      platePanY: 0.03,
      fb0: "#D8D5CC",
      fb1: "#EAE7DF",
      scrimTop: "rgba(8, 9, 11, 0.28)",
      scrimBot: "rgba(246, 245, 240, 0.18)",
      brand: "monolith",
      brandLabel: "Monolith",
      lightBg: false,
      headline: "From one prompt to production",
      sub: "Web, iOS, analytics, and multi-tenant auth compiled together.",
      headX: 0.56,
      headY: 0.18,
      boxW: 0.70,
      boxH: 150,
      cardTop: "rgba(250, 249, 245, 0.96)",
      cardBot: "rgba(240, 238, 230, 0.94)",
      ink: PALETTE.inkLight,
      muted: "rgba(242, 239, 233, 0.80)",
      accentFill: PALETTE.inkDark,
      accentArrow: PALETTE.paperLight,
      caretCol: PALETTE.inkDark,
      modelTag: "Edge v4",
      lightCard: true,
      perspX: 0.28,
      perspY: -0.10,
      roll: 0.032,
      zoom: 1.30,
      chips: [
        { label: "Web + iOS", icon: "globe" },
        { label: "Compute", icon: "cpu" },
        { label: "Metrics", icon: "sliders" },
      ],
    },
    // 4: Leica darkroom iris blades (`s07Amber` graded) + warm charcoal card + cinnabar accent
    {
      plate: "s07Amber",
      plateZoom: 1.10,
      platePanX: 0.02,
      platePanY: 0.0,
      fb0: "#171615",
      fb1: "#09090B",
      scrimTop: "rgba(8, 9, 11, 0.50)",
      scrimBot: "rgba(8, 9, 11, 0.74)",
      brand: "aperture",
      brandLabel: "Aperture",
      lightBg: false,
      headline: "Bring your product to life",
      sub: "Describe the workflow and watch every route and view assemble.",
      headX: 0.54,
      headY: 0.15,
      boxW: 0.65,
      boxH: 152,
      cardTop: "rgba(24, 24, 27, 0.95)",
      cardBot: "rgba(15, 15, 18, 0.96)",
      ink: PALETTE.inkLight,
      muted: "rgba(214, 207, 175, 0.66)",
      accentFill: PALETTE.cvRegistrationTick,
      accentArrow: PALETTE.paperLight,
      caretCol: PALETTE.cvRegistrationTick,
      modelTag: "Optics 2.4",
      lightCard: false,
      perspX: -0.23,
      perspY: 0.12,
      roll: -0.038,
      zoom: 1.32,
      chips: [
        { label: "Artifacts", icon: "layers" },
        { label: "Preview", icon: "sparkles" },
        { label: "Controls", icon: "sliders" },
      ],
      botPills: [
        { label: "Billing", icon: "sliders" },
        { label: "Webhooks", icon: "globe" },
        { label: "Runtime", icon: "cpu" },
      ],
    },
    // 5: Silver-gelatin orbital limb (`s04Horizon` graded) + deep selenium card
    {
      plate: "s04Horizon",
      plateZoom: 1.12,
      platePanX: 0.0,
      platePanY: -0.05,
      fb0: "#0B0D12",
      fb1: "#181D26",
      scrimTop: "rgba(8, 9, 11, 0.30)",
      scrimBot: "rgba(8, 9, 11, 0.64)",
      brand: "kinetix",
      brandLabel: "Kinetix",
      lightBg: false,
      headline: "Scale from zero to millions",
      sub: "Zero-config persistence · instant edge regions · pure speed.",
      headX: 0.58,
      headY: 0.21,
      boxW: 0.68,
      boxH: 148,
      cardTop: "rgba(20, 23, 29, 0.95)",
      cardBot: "rgba(12, 14, 18, 0.96)",
      ink: PALETTE.inkLight,
      muted: "rgba(200, 211, 230, 0.68)",
      accentFill: PALETTE.primaryAccent,
      accentArrow: PALETTE.inkDark,
      caretCol: PALETTE.primaryAccent,
      modelTag: "Scale 2.0",
      lightCard: false,
      perspX: 0.22,
      perspY: -0.14,
      roll: 0.026,
      zoom: 1.25,
      chips: [
        { label: "Regions", icon: "globe" },
        { label: "Realtime", icon: "sparkles" },
        { label: "Source", icon: "code" },
      ],
    },
    // 6: Bright architectural gallery rag (`s03Daylight` close crop) + warm bone card
    {
      plate: "s03Daylight",
      plateZoom: 1.18,
      platePanX: 0.08,
      platePanY: -0.04,
      fb0: "#F2F0E8",
      fb1: "#E0DDD3",
      scrimTop: "rgba(246, 245, 240, 0.76)",
      scrimBot: "rgba(228, 225, 216, 0.68)",
      brand: "vectra",
      brandLabel: "Vectra",
      lightBg: true,
      headline: "Design and ship in one flow",
      sub: "Design tokens, live data tables, and custom domains built in.",
      headX: 0.50,
      headY: 0.19,
      boxW: 0.67,
      boxH: 152,
      cardTop: "rgba(252, 251, 248, 0.97)",
      cardBot: "rgba(244, 242, 236, 0.95)",
      ink: PALETTE.inkDark,
      muted: "rgba(22, 22, 21, 0.58)",
      accentFill: PALETTE.inkDark,
      accentArrow: PALETTE.paperLight,
      caretCol: PALETTE.inkDark,
      modelTag: "Vectra CAD",
      lightCard: true,
      perspX: -0.25,
      perspY: -0.10,
      roll: -0.034,
      zoom: 1.27,
      chips: [
        { label: "System", icon: "layers" },
        { label: "Motion", icon: "sparkles" },
        { label: "Publish", icon: "globe" },
      ],
    },
    // 7: Silver-champagne dispersion prism (`s04Prism` graded) + obsidian terminal card
    {
      plate: "s04Prism",
      plateZoom: 1.06,
      platePanX: 0.03,
      platePanY: 0.0,
      fb0: "#0B0C10",
      fb1: "#16181F",
      scrimTop: "rgba(8, 9, 11, 0.42)",
      scrimBot: "rgba(8, 9, 11, 0.66)",
      brand: "monolith",
      brandLabel: "Monolith",
      lightBg: false,
      headline: "Software at the speed of thought",
      sub: "Zero boilerplate · edge-compiled TypeScript & WebGL2.",
      headX: 0.60,
      headY: 0.20,
      boxW: 0.70,
      boxH: 150,
      cardTop: "rgba(21, 23, 28, 0.95)",
      cardBot: "rgba(13, 14, 18, 0.96)",
      ink: PALETTE.inkLight,
      muted: "rgba(242, 239, 233, 0.64)",
      accentFill: PALETTE.primaryAccent,
      accentArrow: PALETTE.inkDark,
      caretCol: PALETTE.cvRegistrationTick,
      modelTag: "Prism GPU",
      lightCard: false,
      perspX: 0.27,
      perspY: 0.12,
      roll: 0.038,
      zoom: 1.29,
      chips: [
        { label: "Context", icon: "layers" },
        { label: "Inspect", icon: "search" },
        { label: "Compile", icon: "cpu" },
      ],
    },
  ];

  const th = themes[((variant % themes.length) + themes.length) % themes.length];
  const rawPlate = media?.plates?.[th.plate] ?? null;
  const gradedPlate = getGradedPlate(rawPlate) ?? rawPlate;

  if (!drawCoverCanvasOrImage(ctx, gradedPlate, 0, 0, W, H, th.plateZoom, th.platePanX, th.platePanY)) {
    const fb = ctx.createLinearGradient(0, 0, W, H);
    fb.addColorStop(0, th.fb0);
    fb.addColorStop(1, th.fb1);
    ctx.fillStyle = fb;
    ctx.fillRect(0, 0, W, H);
  }

  const scrim = ctx.createLinearGradient(0, 0, 0, H);
  scrim.addColorStop(0, th.scrimTop);
  scrim.addColorStop(1, th.scrimBot);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H);

  // Top architectural navbar
  ctx.save();
  const navY = 40;
  const navInk = th.lightBg ? PALETTE.inkDark : PALETTE.inkLight;
  const navMuted = th.lightBg ? "rgba(22, 22, 21, 0.54)" : "rgba(242, 239, 233, 0.58)";
  drawStudioTile(ctx, th.brand, W * 0.12, navY - 13, 26, th.lightBg);
  ctx.fillStyle = navInk;
  ctx.font = `600 15px ${SANS}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(th.brandLabel, W * 0.12 + 35, navY);

  ctx.font = `500 13px ${SANS}`;
  ctx.fillStyle = navMuted;
  const navItems = ["Product", "Templates", "Docs", "Pricing"];
  for (let i = 0; i < navItems.length; i++) {
    ctx.fillText(navItems[i], W * 0.36 + i * 92, navY);
  }

  roundRectPath(ctx, W * 0.80, navY - 15, 96, 30, 15);
  ctx.fillStyle = th.lightBg ? "rgba(22, 22, 21, 0.07)" : "rgba(242, 239, 233, 0.11)";
  ctx.fill();
  ctx.fillStyle = navInk;
  ctx.font = `600 12.5px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText("Get started", W * 0.80 + 48, navY);
  ctx.restore();

  // Hero display headline above prompt box
  ctx.save();
  ctx.fillStyle = th.ink;
  ctx.font = `700 50px ${SANS}`;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "-0.025em";
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(th.headline, W * th.headX, H * th.headY);

  ctx.fillStyle = th.muted;
  ctx.font = `400 18px ${SANS}`;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "-0.01em";
  }
  ctx.fillText(th.sub, W * th.headX, H * th.headY + 33);
  ctx.restore();

  // Coplanar Prompt Input Glass Card locked around `(anchorX, anchorY)`
  const anchorX = W * 0.24;
  const anchorY = H * 0.485;
  const padX = 28;
  const padY = 43;
  const bx = anchorX - padX;
  const by = anchorY - padY;
  const bw = W * th.boxW;
  const bh = th.boxH;

  ctx.save();
  ctx.shadowColor = th.lightCard ? "rgba(22, 22, 21, 0.13)" : "rgba(0, 0, 0, 0.44)";
  ctx.shadowBlur = 38;
  ctx.shadowOffsetY = 16;
  roundRectPath(ctx, bx, by, bw, bh, 22);
  const cardGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
  cardGrad.addColorStop(0, th.cardTop);
  cardGrad.addColorStop(1, th.cardBot);
  ctx.fillStyle = cardGrad;
  ctx.fill();
  ctx.shadowColor = "transparent";

  strokeGlassRim(ctx, bx, by, bw, bh, 22, th.lightCard);

  const promptInk = th.lightCard ? PALETTE.inkDark : PALETTE.inkLight;
  ctx.save();
  ctx.font = `500 28px ${SANS}`;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "-0.025em";
  }
  ctx.fillStyle = promptInk;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(typedText, anchorX, anchorY);
  if (showCursor) {
    const tw = ctx.measureText(typedText).width;
    ctx.fillStyle = th.caretCol;
    roundRectPath(ctx, anchorX + tw + 3.5, anchorY - 14, 2.0, 28, 1.0);
    ctx.fill();
  }
  ctx.restore();

  // Sculpted hairline toolbar chips
  const cy = by + bh - 31;
  const chipBg = th.lightCard ? "rgba(22, 22, 21, 0.04)" : "rgba(242, 239, 233, 0.055)";
  const chipStroke = th.lightCard ? "rgba(22, 22, 21, 0.08)" : "rgba(242, 239, 233, 0.095)";
  const chipInk = th.lightCard ? "#3A3A38" : "rgba(242, 239, 233, 0.82)";
  const iconTone = th.lightCard ? "#6E6D68" : "rgba(214, 207, 175, 0.78)";

  let cx = anchorX;
  roundRectPath(ctx, cx, cy - 14, 28, 28, 14);
  ctx.fillStyle = chipBg;
  ctx.fill();
  ctx.strokeStyle = chipStroke;
  ctx.lineWidth = 0.75;
  ctx.stroke();
  drawUiIcon(ctx, "paperclip", cx + 14, cy, 14, iconTone, 1.25);
  cx += 36;

  ctx.font = `500 12.5px ${SANS}`;
  for (const ch of th.chips) {
    const labelW = ctx.measureText(ch.label).width;
    const tw = labelW + 36;
    roundRectPath(ctx, cx, cy - 14, tw, 28, 14);
    ctx.fillStyle = chipBg;
    ctx.fill();
    ctx.strokeStyle = chipStroke;
    ctx.lineWidth = 0.75;
    ctx.stroke();

    drawUiIcon(ctx, ch.icon, cx + 14.5, cy, 13.5, iconTone, 1.25);
    ctx.fillStyle = chipInk;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(ch.label, cx + 25, cy + 0.5);
    cx += tw + 8;
  }

  const sendCx = bx + bw - 28;
  const micCx = sendCx - 38;
  ctx.font = `500 12px ${SANS}`;
  const modW = ctx.measureText(th.modelTag).width + 32;
  const modX = micCx - 22 - modW;
  if (modX > cx + 12) {
    roundRectPath(ctx, modX, cy - 13, modW, 26, 13);
    ctx.fillStyle = chipBg;
    ctx.fill();
    ctx.fillStyle = iconTone;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(th.modelTag, modX + 11, cy + 0.5);
    drawUiIcon(ctx, "chevronDown", modX + modW - 12, cy + 0.5, 11, iconTone, 1.2);
  }

  drawUiIcon(ctx, "mic", micCx, cy, 15, iconTone, 1.25);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(sendCx, cy, 15, 0, Math.PI * 2);
  ctx.fillStyle = th.accentFill;
  ctx.fill();
  ctx.restore();
  drawUiIcon(ctx, "arrowUp", sendCx, cy, 14, th.accentArrow, 1.75);

  if (th.botPills) {
    let px = anchorX + 12;
    const py = by + bh + 35;
    ctx.font = `500 12px ${SANS}`;
    for (const pill of th.botPills) {
      const pw = ctx.measureText(pill.label).width + 38;
      roundRectPath(ctx, px, py - 14, pw, 28, 14);
      ctx.fillStyle = "rgba(18, 20, 24, 0.58)";
      ctx.fill();
      ctx.strokeStyle = "rgba(242, 239, 233, 0.09)";
      ctx.lineWidth = 0.75;
      ctx.stroke();
      drawUiIcon(ctx, pill.icon, px + 15, py, 12.5, PALETTE.primaryAccent, 1.2);
      ctx.fillStyle = "rgba(242, 239, 233, 0.80)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(pill.label, px + 25.5, py + 0.5);
      px += pw + 10;
    }
  }

  ctx.restore();

  return {
    lightCard: th.lightCard,
    perspX: th.perspX,
    perspY: th.perspY,
    roll: th.roll,
    zoom: th.zoom,
    anchorUvX: anchorX / W,
    anchorUvY: anchorY / H,
  };
}

// ============================================================================
// SCENE 04 ("Millions of products are built every day."):
// 8 World-01 Silver-Gelatin & Champagne Product Browser Windows
// ============================================================================
export function drawMiniProductCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  variant: number,
  media?: MockupMedia,
): void {
  type ProductSite = {
    plate: string;
    zoom: number;
    panY: number;
    fb0: string;
    fb1: string;
    scrimA: string;
    scrimB: string;
    mark: StudioMark;
    brand: string;
    domain: string;
    kicker: string;
    line1: string;
    line2: string;
    cta: string;
    accent: string;
    light: boolean;
    layout: "centerGlass" | "splitLeft" | "bottomDock";
  };

  const sites: ProductSite[] = [
    {
      plate: "s03Aurora", zoom: 1.08, panY: 0,
      fb0: "#1B1E24", fb1: "#0B0D11",
      scrimA: "rgba(8, 9, 11, 0.34)", scrimB: "rgba(8, 9, 11, 0.76)",
      mark: "solis", brand: "Solis", domain: "solis.studio",
      kicker: "OPTICAL ENGINE 2.0", line1: "Shape living light", line2: "in real-time WebGL2.",
      cta: "Start building", accent: PALETTE.primaryAccent, light: false, layout: "centerGlass",
    },
    {
      plate: "s04Dune", zoom: 1.06, panY: 0.02,
      fb0: "#2B2822", fb1: "#0E0D0B",
      scrimA: "rgba(12, 12, 10, 0.22)", scrimB: "rgba(8, 9, 11, 0.78)",
      mark: "aperture", brand: "Dune AI", domain: "dune.systems",
      kicker: "FRONTIER COMPUTE", line1: "Autonomous worlds", line2: "at planetary scale.",
      cta: "Explore sandbox", accent: PALETTE.cvRegistrationTick, light: false, layout: "bottomDock",
    },
    {
      plate: "s03Dusk", zoom: 1.08, panY: 0,
      fb0: "#17191E", fb1: "#08090B",
      scrimA: "rgba(8, 9, 11, 0.44)", scrimB: "rgba(8, 9, 11, 0.82)",
      mark: "vectra", brand: "Vectra", domain: "vectra.app",
      kicker: "SPATIAL SYSTEM", line1: "Product architecture", line2: "for teams & agents.",
      cta: "Open workspace", accent: PALETTE.primaryAccent, light: false, layout: "splitLeft",
    },
    {
      plate: "s04Horizon", zoom: 1.12, panY: -0.04,
      fb0: "#0A0C10", fb1: "#1A202B",
      scrimA: "rgba(8, 9, 11, 0.28)", scrimB: "rgba(8, 9, 11, 0.74)",
      mark: "kinetix", brand: "Horizon", domain: "horizon.cloud",
      kicker: "GLOBAL EDGE", line1: "Deploy everywhere", line2: "in 14 milliseconds.",
      cta: "Ship now", accent: PALETTE.primaryAccent, light: false, layout: "centerGlass",
    },
    {
      plate: "s07Stage", zoom: 1.06, panY: 0,
      fb0: "#12151B", fb1: "#08090B",
      scrimA: "rgba(8, 9, 11, 0.34)", scrimB: "rgba(8, 9, 11, 0.82)",
      mark: "delineate", brand: "delineate", domain: "delineate.design",
      kicker: "MOTION DIRECTION", line1: "Drawings that move", line2: "when you do.",
      cta: "View collection", accent: PALETTE.primaryAccent, light: false, layout: "bottomDock",
    },
    {
      plate: "s04Prism", zoom: 1.08, panY: 0,
      fb0: "#0B0D12", fb1: "#181B22",
      scrimA: "rgba(8, 9, 11, 0.38)", scrimB: "rgba(8, 9, 11, 0.80)",
      mark: "monolith", brand: "Monolith", domain: "monolith.sh",
      kicker: "RAYTRACE COMPILER", line1: "Zero-dependency", line2: "shader pipelines.",
      cta: "Read docs", accent: PALETTE.primaryAccent, light: false, layout: "splitLeft",
    },
    {
      plate: "s03Daylight", zoom: 1.06, panY: 0,
      fb0: "#F6F5F0", fb1: "#E4E1D8",
      scrimA: "rgba(246, 245, 240, 0.80)", scrimB: "rgba(228, 225, 216, 0.60)",
      mark: "delineate", brand: "Atelier", domain: "atelier.build",
      kicker: "EDITORIAL CANVAS", line1: "Craft interfaces", line2: "with tactile physics.",
      cta: "Try live", accent: PALETTE.inkDark, light: true, layout: "splitLeft",
    },
    {
      plate: "s07Amber", zoom: 1.08, panY: 0,
      fb0: "#181614", fb1: "#08090B",
      scrimA: "rgba(8, 9, 11, 0.40)", scrimB: "rgba(8, 9, 11, 0.82)",
      mark: "aperture", brand: "Aperture", domain: "aperture.film",
      kicker: "24 FPS CINEMA", line1: "Anamorphic optics", line2: "in pure code.",
      cta: "Watch reel", accent: PALETTE.cvRegistrationTick, light: false, layout: "centerGlass",
    },
  ];

  const st = sites[((variant % sites.length) + sites.length) % sites.length];
  const barH = 22;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 13;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.fillStyle = st.light ? PALETTE.paperLight : PALETTE.obsidianVoid;
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.translate(-w / 2, -h / 2);
  roundRectPath(ctx, 0, 0, w, h, 10);
  ctx.clip();

  const rawPlate = media?.plates?.[st.plate] ?? null;
  const gradedPlate = getGradedPlate(rawPlate) ?? rawPlate;
  if (!drawCoverCanvasOrImage(ctx, gradedPlate, 0, barH, w, h - barH, st.zoom, 0, st.panY)) {
    const fb = ctx.createLinearGradient(0, barH, w, h);
    fb.addColorStop(0, st.fb0);
    fb.addColorStop(1, st.fb1);
    ctx.fillStyle = fb;
    ctx.fillRect(0, barH, w, h - barH);
  }

  const scrim = ctx.createLinearGradient(0, barH, 0, h);
  scrim.addColorStop(0, st.scrimA);
  scrim.addColorStop(1, st.scrimB);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, barH, w, h - barH);

  // Translucent window chrome
  ctx.fillStyle = st.light ? "rgba(246, 245, 240, 0.92)" : "rgba(14, 16, 20, 0.90)";
  ctx.fillRect(0, 0, w, barH);
  ctx.fillStyle = st.light ? "rgba(22, 22, 21, 0.08)" : "rgba(242, 239, 233, 0.07)";
  ctx.fillRect(0, barH - 0.75, w, 0.75);

  const pipCol = st.light ? "rgba(22, 22, 21, 0.22)" : "rgba(242, 239, 233, 0.24)";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(12 + i * 7.5, barH * 0.5, 2.0, 0, Math.PI * 2);
    ctx.fillStyle = pipCol;
    ctx.fill();
  }

  const urlW = Math.min(136, w * 0.36);
  roundRectPath(ctx, (w - urlW) * 0.5, 4, urlW, 14, 4.5);
  ctx.fillStyle = st.light ? "rgba(22, 22, 21, 0.045)" : "rgba(242, 239, 233, 0.06)";
  ctx.fill();
  ctx.fillStyle = st.light ? "rgba(22, 22, 21, 0.54)" : "rgba(242, 239, 233, 0.56)";
  ctx.font = `500 7.5px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(st.domain, w * 0.5, 11.2);

  // In-page Studio Navbar
  const navY = barH + 17;
  const ink = st.light ? PALETTE.inkDark : PALETTE.inkLight;
  const muted = st.light ? "rgba(22, 22, 21, 0.58)" : "rgba(242, 239, 233, 0.60)";
  drawStudioTile(ctx, st.mark, 16, navY - 7.5, 15, st.light);
  ctx.fillStyle = ink;
  ctx.font = `600 9.5px ${SANS}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(st.brand, 36, navY + 0.5);

  ctx.font = `500 8px ${SANS}`;
  ctx.fillStyle = muted;
  ctx.fillText("Features", w * 0.40, navY);
  ctx.fillText("Engine", w * 0.52, navY);
  ctx.fillText("Pricing", w * 0.63, navY);

  roundRectPath(ctx, w - 58, navY - 8, 42, 16, 8);
  ctx.fillStyle = st.light ? PALETTE.inkDark : "rgba(242, 239, 233, 0.14)";
  ctx.fill();
  ctx.fillStyle = PALETTE.paperLight;
  ctx.font = `600 7.5px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText("Launch", w - 37, navY + 0.5);

  if (st.layout === "splitLeft") {
    const lx = 18;
    const hy = barH + (h - barH) * 0.34;
    ctx.fillStyle = st.light ? PALETTE.hairlineMuted : "rgba(214, 207, 175, 0.72)";
    ctx.font = `500 7.5px ${MONO}`;
    ctx.textAlign = "left";
    ctx.fillText(st.kicker, lx, hy - 18);

    ctx.fillStyle = ink;
    ctx.font = `700 15.5px ${SANS}`;
    ctx.fillText(st.line1, lx, hy);
    ctx.fillText(st.line2, lx, hy + 18);

    const ctaY = hy + 38;
    roundRectPath(ctx, lx, ctaY, 76, 20, 10);
    ctx.fillStyle = st.light ? PALETTE.inkDark : PALETTE.inkLight;
    ctx.fill();
    const ctaInk = st.light ? PALETTE.paperLight : PALETTE.inkDark;
    ctx.fillStyle = ctaInk;
    ctx.font = `600 8.5px ${SANS}`;
    ctx.fillText(st.cta, lx + 11, ctaY + 10.5);
    drawUiIcon(ctx, "arrowUp", lx + 64, ctaY + 10, 8.5, ctaInk, 1.25);

    const rx = w * 0.53;
    const ry = barH + 36;
    const rw = w * 0.43;
    const rh = h - ry - 14;
    roundRectPath(ctx, rx, ry, rw, rh, 9);
    ctx.fillStyle = st.light ? "rgba(250, 249, 245, 0.88)" : "rgba(18, 20, 24, 0.84)";
    ctx.fill();
    strokeGlassRim(ctx, rx, ry, rw, rh, 9, st.light);

    const barAccent = st.light ? PALETTE.inkDark : PALETTE.primaryAccent;
    drawUiIcon(ctx, "layers", rx + 13, ry + 13, 10, barAccent, 1.15);
    ctx.fillStyle = ink;
    ctx.font = `600 8px ${SANS}`;
    ctx.fillText("Scene Graph · 24fps", rx + 22, ry + 13.5);

    for (let r = 0; r < 3; r++) {
      const my = ry + 30 + r * 18;
      if (my + 12 > ry + rh) break;
      roundRectPath(ctx, rx + 10, my, rw - 20, 13, 4);
      ctx.fillStyle = st.light ? "rgba(22, 22, 21, 0.045)" : "rgba(242, 239, 233, 0.05)";
      ctx.fill();
      roundRectPath(ctx, rx + 14, my + 4.5, (rw - 44) * (0.78 - r * 0.18), 4, 2);
      ctx.fillStyle = r === 0 ? barAccent : muted;
      ctx.fill();
    }
  } else {
    const hy = barH + (h - barH) * 0.30;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(214, 207, 175, 0.78)";
    ctx.font = `500 7.5px ${MONO}`;
    ctx.fillText(st.kicker, w * 0.5, hy - 17);

    ctx.fillStyle = PALETTE.inkLight;
    ctx.font = `700 16px ${SANS}`;
    ctx.fillText(`${st.line1} ${st.line2}`, w * 0.5, hy + 1);

    const dw = w * 0.74;
    const dh = 40;
    const dx = (w - dw) * 0.5;
    const dy = h - dh - 16;
    roundRectPath(ctx, dx, dy, dw, dh, 11);
    ctx.fillStyle = "rgba(16, 18, 22, 0.86)";
    ctx.fill();
    strokeGlassRim(ctx, dx, dy, dw, dh, 11, false);

    drawUiIcon(ctx, "sparkles", dx + 15, dy + dh * 0.5, 11, st.accent);
    ctx.fillStyle = "rgba(242, 239, 233, 0.84)";
    ctx.font = `500 9px ${SANS}`;
    ctx.textAlign = "left";
    ctx.fillText(st.cta + " with natural intent...", dx + 27, dy + dh * 0.5 + 0.5);

    ctx.beginPath();
    ctx.arc(dx + dw - 16, dy + dh * 0.5, 9, 0, Math.PI * 2);
    ctx.fillStyle = st.accent;
    ctx.fill();
    const arrowCol = st.accent === PALETTE.cvRegistrationTick ? PALETTE.paperLight : PALETTE.inkDark;
    drawUiIcon(ctx, "arrowUp", dx + dw - 16, dy + dh * 0.5, 9, arrowCol, 1.45);
  }

  strokeGlassRim(ctx, 0, 0, w, h, 10, st.light);
  ctx.restore();
}

// ============================================================================
// SCENE 07 ("every remembered work"): 6 World-01 Studio Profiles
// ============================================================================
export function drawBrandMacroBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  variant: number,
  media?: MockupMedia,
): { perspX: number; perspY: number; roll: number; zoom: number } {
  type BrandDef = {
    bg: string;
    plate: string;
    plateZoom: number;
    platePanY: number;
    fbA: string;
    fbB: string;
    name: string;
    handle: string;
    bio: string;
    metaTag: string;
    followers: string;
    bannerText?: string;
    mark: StudioMark;
    perspX: number;
    perspY: number;
    roll: number;
    zoom: number;
  };

  const brands: BrandDef[] = [
    {
      bg: PALETTE.obsidianVoid,
      plate: "s04Prism",
      plateZoom: 1.06,
      platePanY: 0.04,
      fbA: "#16181F",
      fbB: "#08090B",
      name: "Vectra",
      handle: "@vectra",
      bio: "Spatial CAD & real-time shader architecture.",
      metaTag: "Zurich  ·  Est. 2026",
      followers: "184K",
      mark: "vectra",
      perspX: 0.24,
      perspY: -0.10,
      roll: 0.028,
      zoom: 1.24,
    },
    {
      bg: "#09090B",
      plate: "s03Aurora",
      plateZoom: 1.05,
      platePanY: 0.0,
      fbA: "#1F1E22",
      fbB: "#09090B",
      name: "Solis",
      handle: "@solis_studio",
      bio: "Generative optics & procedural cinema tools.",
      metaTag: "Stockholm  ·  2027 Edition",
      followers: "246K",
      bannerText: "Shape living light",
      mark: "solis",
      perspX: -0.22,
      perspY: -0.12,
      roll: -0.024,
      zoom: 1.28,
    },
    {
      bg: PALETTE.obsidianVoid,
      plate: "s07Stage",
      plateZoom: 1.04,
      platePanY: -0.04,
      fbA: "#1A1F28",
      fbB: "#08090B",
      name: "Delineate",
      handle: "@delineate",
      bio: "Drawings and shaders that move when you do.",
      metaTag: "New York  ·  24 fps",
      followers: "312K",
      mark: "delineate",
      perspX: 0.26,
      perspY: 0.10,
      roll: 0.032,
      zoom: 1.26,
    },
    {
      bg: "#080A0C",
      plate: "s03Dusk",
      plateZoom: 1.08,
      platePanY: 0.0,
      fbA: "#181B20",
      fbB: "#080A0C",
      name: "Kinetix",
      handle: "@kinetix",
      bio: "Interruptible spring & fluid tactile physics.",
      metaTag: "Tokyo  ·  Est. 2026",
      followers: "129K",
      mark: "kinetix",
      perspX: -0.20,
      perspY: 0.12,
      roll: -0.026,
      zoom: 1.25,
    },
    {
      bg: PALETTE.obsidianVoid,
      plate: "s04Horizon",
      plateZoom: 1.16,
      platePanY: 0.12,
      fbA: "#1C212B",
      fbB: "#08090B",
      name: "Monolith",
      handle: "@monolith",
      bio: "Zero-dependency optical & compute runtime.",
      metaTag: "San Francisco  ·  2027 Edition",
      followers: "410K",
      mark: "monolith",
      perspX: 0.28,
      perspY: -0.08,
      roll: 0.024,
      zoom: 1.30,
    },
    {
      bg: "#0A0908",
      plate: "s07Amber",
      plateZoom: 1.06,
      platePanY: 0.0,
      fbA: "#241E1A",
      fbB: "#0A0908",
      name: "Aperture",
      handle: "@aperture_film",
      bio: "24 fps anamorphic halation & film synthesis.",
      metaTag: "London  ·  24 fps",
      followers: "168K",
      mark: "aperture",
      perspX: -0.24,
      perspY: -0.10,
      roll: -0.030,
      zoom: 1.26,
    },
  ];

  const b = brands[((variant % brands.length) + brands.length) % brands.length];
  const bannerH = H * 0.43;

  ctx.fillStyle = b.bg;
  ctx.fillRect(0, 0, W, H);

  const rawPlate = media?.plates?.[b.plate] ?? null;
  const gradedPlate = getGradedPlate(rawPlate) ?? rawPlate;
  if (!drawCoverCanvasOrImage(ctx, gradedPlate, 0, 0, W, bannerH, b.plateZoom, 0.04, b.platePanY)) {
    const fb = ctx.createLinearGradient(0, 0, W, bannerH);
    fb.addColorStop(0, b.fbA);
    fb.addColorStop(1, b.fbB);
    ctx.fillStyle = fb;
    ctx.fillRect(0, 0, W, bannerH);
  }

  const bScrim = ctx.createLinearGradient(0, 0, 0, bannerH);
  bScrim.addColorStop(0, "rgba(8, 9, 11, 0.16)");
  bScrim.addColorStop(0.66, "rgba(8, 9, 11, 0.10)");
  bScrim.addColorStop(1, "rgba(8, 9, 11, 0.62)");
  ctx.fillStyle = bScrim;
  ctx.fillRect(0, 0, W, bannerH);

  if (b.bannerText) {
    ctx.save();
    ctx.fillStyle = PALETTE.inkLight;
    ctx.font = `700 56px ${SANS}`;
    if ("letterSpacing" in ctx) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "-0.028em";
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(b.bannerText, W * 0.46, bannerH * 0.78);
    ctx.restore();
  }

  ctx.fillStyle = "rgba(242, 239, 233, 0.08)";
  ctx.fillRect(0, bannerH, W, 0.75);

  // Top-left frosted `arrowLeft` circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(88, 52, 18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(8, 9, 11, 0.52)";
  ctx.fill();
  ctx.strokeStyle = "rgba(242, 239, 233, 0.14)";
  ctx.lineWidth = 0.75;
  ctx.stroke();
  drawUiIcon(ctx, "arrowLeft", 88, 52, 16, PALETTE.inkLight, 1.4);
  ctx.restore();

  // Right-side profile action row: `[···]` + `[bell]` + crisp `"Follow"` pill
  const actY = H * 0.555;
  ctx.save();
  for (const [ax, ic] of [
    [W * 0.735, "dots"],
    [W * 0.775, "bell"],
  ] as Array<[number, UiIconName]>) {
    ctx.beginPath();
    ctx.arc(ax, actY, 17.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(242, 239, 233, 0.035)";
    ctx.fill();
    ctx.strokeStyle = "rgba(242, 239, 233, 0.16)";
    ctx.lineWidth = 0.85;
    ctx.stroke();
    drawUiIcon(ctx, ic, ax, actY, 15.5, "rgba(242, 239, 233, 0.82)", 1.35);
  }

  roundRectPath(ctx, W * 0.802, actY - 17.5, 96, 35, 17.5);
  ctx.fillStyle = PALETTE.inkLight;
  ctx.fill();
  ctx.fillStyle = PALETTE.inkDark;
  ctx.font = `600 14px ${SANS}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Follow", W * 0.802 + 48, actY + 0.5);
  ctx.restore();

  // Recessed profile bezel cutout + 232px World-01 G2 Superellipse Studio Tile
  const ix = 216;
  const iy = H * 0.24;
  const is = 232;
  ctx.save();
  traceSuperellipse(ctx, ix + is * 0.5, iy + is * 0.5, is * 0.5 + 8, 4.4, 64);
  ctx.fillStyle = b.bg;
  ctx.fill();
  ctx.restore();

  drawStudioTile(ctx, b.mark, ix, iy, is, false);

  // Display Name + Warm Champagne Verified Seal + Handle + Bio + Timeless Studio Metadata
  const nameY = iy + is + 50;
  ctx.save();
  ctx.fillStyle = PALETTE.inkLight;
  ctx.font = `700 32px ${SANS}`;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "-0.022em";
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(b.name, ix + 4, nameY);
  const nw = ctx.measureText(b.name).width;
  drawUiIcon(ctx, "verified", ix + 21 + nw, nameY + 0.5, 22, PALETTE.primaryAccent);

  ctx.fillStyle = PALETTE.hairlineMuted;
  ctx.font = `400 18.5px ${SANS}`;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0.005em";
  }
  ctx.fillText(b.handle, ix + 4, nameY + 32);

  ctx.fillStyle = "rgba(242, 239, 233, 0.70)";
  ctx.font = `400 16px ${SANS}`;
  ctx.fillText(b.bio, ix + 4, nameY + 61);

  const metaY = nameY + 90;
  drawUiIcon(ctx, "globe", ix + 11, metaY, 13.5, PALETTE.hairlineMuted, 1.2);
  ctx.fillStyle = PALETTE.hairlineMuted;
  ctx.font = `400 14px ${SANS}`;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0.015em";
  }
  const locText = `${b.metaTag}  ·  `;
  ctx.fillText(locText, ix + 24, metaY + 0.5);
  const lw = ctx.measureText(locText).width;
  ctx.fillStyle = PALETTE.inkLight;
  ctx.font = `600 14px ${SANS}`;
  ctx.fillText(b.followers, ix + 24 + lw, metaY + 0.5);
  const fw = ctx.measureText(b.followers).width;
  ctx.fillStyle = PALETTE.hairlineMuted;
  ctx.font = `400 14px ${SANS}`;
  ctx.fillText(" Followers", ix + 24 + lw + fw, metaY + 0.5);
  ctx.restore();

  const vig = ctx.createLinearGradient(W * 0.40, 0, W, 0);
  vig.addColorStop(0, "rgba(8, 9, 11, 0)");
  vig.addColorStop(0.52, "rgba(8, 9, 11, 0.46)");
  vig.addColorStop(1, "rgba(8, 9, 11, 0.72)");
  ctx.fillStyle = vig;
  ctx.fillRect(W * 0.40, 0, W * 0.60, H);

  return { perspX: b.perspX, perspY: b.perspY, roll: b.roll, zoom: b.zoom };
}

// ============================================================================
// SCENE 10C ("you do."): 5 World-01 Showcase Cards
// Preserves exact 16:9 player rect `(vx = x+14, vy = y+86, vw = w-28, vh = h-118)`!
// ============================================================================
export function drawLaunchPostCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  variant: number,
  frame: number,
  media?: MockupMedia,
): void {
  const posts: Array<{
    author: string;
    handle: string;
    time: string;
    line1: string;
    line2: string;
    dur: string;
    mark: StudioMark;
    scene: "iris" | "lightblade" | "stage" | "ui" | "endcard";
    metrics: [string, string, string, string];
  }> = [
    {
      author: "Aperture",
      handle: "@aperture_film",
      time: "2h",
      line1: "Optical Engine 2.0 — real-time crown-glass refraction in WebGL2.",
      line2: "Silver-gelatin grading, quadtree anatomy & 35mm grain.",
      dur: "0:48",
      mark: "aperture",
      scene: "iris",
      metrics: ["64", "412", "6.2K", "248K"],
    },
    {
      author: "Solis",
      handle: "@solis_studio",
      time: "4h",
      line1: "Collimated light architectures that breathe with 134 BPM techno.",
      line2: "Procedural optical apertures, caustic dust & Kodak halation.",
      dur: "0:36",
      mark: "solis",
      scene: "lightblade",
      metrics: ["91", "580", "8.4K", "390K"],
    },
    {
      author: "Delineate",
      handle: "@delineate",
      time: "1h",
      line1: "Drawings and living forms that move when you do.",
      line2: "Zero runtime dependencies — pure WebGL2, Canvas2D & Setloom.",
      dur: "1:04",
      mark: "delineate",
      scene: "stage",
      metrics: ["128", "740", "11K", "512K"],
    },
    {
      author: "Vectra",
      handle: "@vectra",
      time: "5h",
      line1: "Design in true 3D perspective with live Leica Scheimpflug focus.",
      line2: "From natural intent to remembered work in one flow.",
      dur: "0:52",
      mark: "vectra",
      scene: "ui",
      metrics: ["53", "294", "4.9K", "186K"],
    },
    {
      author: "Monolith",
      handle: "@monolith",
      time: "Just now",
      line1: "When restraint meets velocity, people feel it on frame one.",
      line2: "Crafted from first principles — sound on.",
      dur: "0:18",
      mark: "monolith",
      scene: "endcard",
      metrics: ["42", "318", "4.8K", "192K"],
    },
  ];

  const p = posts[((variant % posts.length) + posts.length) % posts.length];

  ctx.save();

  // Softened multi-layered ambient shadow + selenium-obsidian glass shell + 0.75px rim
  ctx.shadowColor = "rgba(0, 0, 0, 0.62)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 14;
  roundRectPath(ctx, x, y, w, h, 14);
  const shellGrad = ctx.createLinearGradient(x, y, x, y + h);
  shellGrad.addColorStop(0, PALETTE.surfaceElevated);
  shellGrad.addColorStop(1, PALETTE.obsidianVoid);
  ctx.fillStyle = shellGrad;
  ctx.fill();
  ctx.shadowColor = "transparent";
  strokeGlassRim(ctx, x, y, w, h, 14, false);

  // 26px World-01 G2 Superellipse Avatar + Warm Champagne Verified Seal + `dots`
  drawStudioTile(ctx, p.mark, x + 14, y + 13, 26, false);

  ctx.fillStyle = PALETTE.inkLight;
  ctx.font = `600 12.5px ${SANS}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(p.author, x + 47, y + 20);
  const aw = ctx.measureText(p.author).width;
  drawUiIcon(ctx, "verified", x + 56 + aw, y + 20, 12, PALETTE.primaryAccent);

  ctx.fillStyle = PALETTE.hairlineMuted;
  ctx.font = `400 11px ${SANS}`;
  ctx.fillText(`${p.handle} · ${p.time}`, x + 47, y + 34);

  drawUiIcon(ctx, "dots", x + w - 21, y + 22, 14, PALETTE.hairlineMuted);

  ctx.fillStyle = "rgba(242, 239, 233, 0.88)";
  ctx.font = `400 11.5px ${SANS}`;
  ctx.fillText(p.line1, x + 14, y + 55);
  ctx.fillStyle = "rgba(242, 239, 233, 0.56)";
  ctx.fillText(p.line2, x + 14, y + 71);

  // Exact 16:9 Embedded Cinema Frame (`vx = x+14, vy = y+86, vw = w-28, vh = h-118`)
  const vx = x + 14;
  const vy = y + 86;
  const vw = w - 28;
  const vh = h - 118;
  const cx = vx + vw * 0.5;
  const cy = vy + vh * 0.5;

  ctx.save();
  roundRectPath(ctx, vx, vy, vw, vh, 10);
  ctx.clip();

  const drift = (frame % 16) / 16;

  if (p.scene === "iris") {
    ctx.fillStyle = PALETTE.obsidianVoid;
    ctx.fillRect(vx, vy, vw, vh);
    const gradedEye = getGradedEye(media?.eye ?? null) ?? media?.eye;
    drawCoverCanvasOrImage(ctx, gradedEye, vx, vy, vw, vh, 1.24 + drift * 0.05, -0.02, -0.09);

    // Gentle outer-only vignette preserving the 3-value mineral iris & dark pupil!
    const vg = ctx.createRadialGradient(cx, cy, vw * 0.18, cx, cy, vw * 0.60);
    vg.addColorStop(0, "rgba(8, 9, 11, 0)");
    vg.addColorStop(1, "rgba(8, 9, 11, 0.72)");
    ctx.fillStyle = vg;
    ctx.fillRect(vx, vy, vw, vh);

    // Beveled crown-glass refraction slab
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - 84, cy - 40, 72, 54);
    ctx.clip();
    drawCoverCanvasOrImage(ctx, gradedEye, vx, vy, vw, vh, 1.40 + drift * 0.05, 0.0, -0.06);
    ctx.fillStyle = "rgba(214, 207, 175, 0.10)";
    ctx.fillRect(cx - 84, cy - 40, 72, 54);
    ctx.restore();
    ctx.strokeStyle = "rgba(242, 239, 233, 0.28)";
    ctx.lineWidth = 0.75;
    ctx.strokeRect(cx - 83.5, cy - 39.5, 71, 53);

    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(8, 9, 11, 0.58)";
    ctx.fill();
    ctx.strokeStyle = "rgba(242, 239, 233, 0.30)";
    ctx.lineWidth = 0.85;
    ctx.stroke();
    drawUiIcon(ctx, "play", cx, cy, 13, PALETTE.inkLight);
  } else if (p.scene === "lightblade") {
    // Real Hasselblad/ARRI smoked-crystal diagonal light-blade plate (World 01 Silver Gelatin LUT!)
    ctx.fillStyle = PALETTE.obsidianVoid;
    ctx.fillRect(vx, vy, vw, vh);
    const rawForm = media?.plates?.s09Form ?? null;
    const gradedForm = getGradedPlate(rawForm) ?? rawForm;
    if (gradedForm) {
      drawCoverCanvasOrImage(ctx, gradedForm, vx, vy, vw, vh, 1.08 + drift * 0.05, 0.02 - drift * 0.02, 0.0);
    } else {
      ctx.save();
      ctx.translate(cx - 12, cy + 4);
      ctx.rotate(-0.66);
      const beam = ctx.createLinearGradient(0, -48, 0, 48);
      beam.addColorStop(0, "rgba(0, 0, 0, 0)");
      beam.addColorStop(0.50, "rgba(246, 245, 240, 0.92)");
      beam.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = beam;
      ctx.fillRect(-260, -48, 520, 96);
      ctx.restore();
    }

    const fgV = ctx.createRadialGradient(cx, cy, vw * 0.16, cx, cy, vw * 0.62);
    fgV.addColorStop(0, "rgba(8, 9, 11, 0)");
    fgV.addColorStop(1, "rgba(8, 9, 11, 0.56)");
    ctx.fillStyle = fgV;
    ctx.fillRect(vx, vy, vw, vh);

    roundRectPath(ctx, vx + 10, vy + 10, 78, 16, 4);
    ctx.fillStyle = "rgba(8, 9, 11, 0.64)";
    ctx.fill();
    ctx.fillStyle = PALETTE.primaryAccent;
    ctx.font = `500 8px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText("24 FPS · PRISM", vx + 49, vy + 18.4);
  } else if (p.scene === "stage") {
    ctx.fillStyle = PALETTE.obsidianVoid;
    ctx.fillRect(vx, vy, vw, vh);
    const rawStage = media?.plates?.s07Stage ?? null;
    const gradedStage = getGradedPlate(rawStage) ?? rawStage;
    drawCoverCanvasOrImage(ctx, gradedStage, vx, vy, vw, vh, 1.06 + drift * 0.04, 0, 0);

    const sg = ctx.createRadialGradient(cx, cy, 12, cx, cy, vw * 0.60);
    sg.addColorStop(0, "rgba(8, 9, 11, 0.24)");
    sg.addColorStop(1, "rgba(8, 9, 11, 0.68)");
    ctx.fillStyle = sg;
    ctx.fillRect(vx, vy, vw, vh);

    ctx.fillStyle = PALETTE.inkLight;
    ctx.font = `500 14px ${SANS}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("delineate · cut", cx, cy + 2);
  } else if (p.scene === "ui") {
    ctx.fillStyle = PALETTE.obsidianVoid;
    ctx.fillRect(vx, vy, vw, vh);
    const rawPrism = media?.plates?.s04Prism ?? null;
    const gradedPrism = getGradedPlate(rawPrism) ?? rawPrism;
    drawCoverCanvasOrImage(ctx, gradedPrism, vx, vy, vw, vh, 1.12 + drift * 0.04, 0.02, 0);
    ctx.fillStyle = "rgba(8, 9, 11, 0.36)";
    ctx.fillRect(vx, vy, vw, vh);

    const cw = vw * 0.74;
    const ch = 66;
    const cardX = cx - cw * 0.5;
    const cardY = cy - ch * 0.5;
    roundRectPath(ctx, cardX, cardY, cw, ch, 12);
    ctx.fillStyle = "rgba(18, 20, 24, 0.88)";
    ctx.fill();
    strokeGlassRim(ctx, cardX, cardY, cw, ch, 12, false);

    ctx.fillStyle = PALETTE.inkLight;
    ctx.font = `500 12px ${SANS}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Moves when you do", cardX + 16, cardY + 23);

    drawUiIcon(ctx, "sparkles", cardX + 21, cardY + 47, 10.5, PALETTE.primaryAccent);
    ctx.fillStyle = PALETTE.hairlineMuted;
    ctx.font = `500 9.5px ${SANS}`;
    ctx.fillText("24 fps WebGL2", cardX + 31, cardY + 47.5);

    ctx.beginPath();
    ctx.arc(cardX + cw - 20, cardY + 45, 9.5, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.primaryAccent;
    ctx.fill();
    drawUiIcon(ctx, "arrowUp", cardX + cw - 20, cardY + 45, 9.5, PALETTE.inkDark, 1.45);
  } else {
    // Card #5 (`endcard`, F 392..397): sleek selenium-obsidian slate + champagne-rimmed pill
    ctx.fillStyle = PALETTE.obsidianVoid;
    ctx.fillRect(vx, vy, vw, vh);
    const eg = ctx.createRadialGradient(cx, vy, 8, cx, vy + vh * 0.45, vw * 0.55);
    eg.addColorStop(0, "rgba(214, 207, 175, 0.11)");
    eg.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = eg;
    ctx.fillRect(vx, vy, vw, vh);

    roundRectPath(ctx, cx - 68, cy - 15.5, 136, 31, 15.5);
    ctx.fillStyle = "rgba(242, 239, 233, 0.055)";
    ctx.fill();
    ctx.strokeStyle = "rgba(214, 207, 175, 0.30)";
    ctx.lineWidth = 0.75;
    ctx.stroke();

    drawUiIcon(ctx, "sparkles", cx - 44, cy, 12, PALETTE.primaryAccent);
    ctx.fillStyle = PALETTE.inkLight;
    ctx.font = `500 11.5px ${SANS}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("delineate · 2027", cx - 30, cy + 0.5);
  }

  // Scrubber with Swiss cinnabar progress hairline + timecode pill
  ctx.fillStyle = "rgba(242, 239, 233, 0.15)";
  ctx.fillRect(vx + 10, vy + vh - 8, vw - 20, 1.5);
  ctx.fillStyle = PALETTE.cvRegistrationTick;
  ctx.fillRect(vx + 10, vy + vh - 8, (((frame % 24) + 1) / 24) * (vw - 20), 1.5);

  roundRectPath(ctx, vx + vw - 44, vy + vh - 26, 34, 15, 4);
  ctx.fillStyle = "rgba(8, 9, 11, 0.74)";
  ctx.fill();
  ctx.fillStyle = PALETTE.inkLight;
  ctx.font = `500 8.5px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(p.dur, vx + vw - 27, vy + vh - 18.2);
  ctx.restore();

  roundRectPath(ctx, vx + 0.5, vy + 0.5, vw - 1, vh - 1, 10);
  ctx.strokeStyle = "rgba(242, 239, 233, 0.09)";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  // Hairline Vector Social Footer
  const fy = y + h - 15;
  const fCol = PALETTE.hairlineMuted;
  ctx.font = `400 10px ${MONO}`;
  if ("fontVariantNumeric" in ctx) {
    (ctx as CanvasRenderingContext2D & { fontVariantNumeric: string }).fontVariantNumeric =
      "tabular-nums";
  }
  ctx.fillStyle = fCol;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const socialItems: Array<[UiIconName, string, number]> = [
    ["comment", p.metrics[0], x + 20],
    ["repost", p.metrics[1], x + 86],
    ["heart", p.metrics[2], x + 158],
    ["chart", p.metrics[3], x + 236],
  ];
  for (const [ic, val, ixPos] of socialItems) {
    drawUiIcon(ctx, ic, ixPos, fy, 12, fCol, 1.15);
    ctx.fillText(val, ixPos + 10, fy + 0.5);
  }

  drawUiIcon(ctx, "bookmark", x + w - 40, fy, 12, fCol, 1.15);
  drawUiIcon(ctx, "share", x + w - 19, fy, 12, fCol, 1.15);

  ctx.restore();
}
