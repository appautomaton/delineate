import { GARDENS, SPRING } from "../src/garden/gardens.js";
import PLANTS from "../src/garden/plants.json" with { type: "json" };
import { chosenGarden, emblem, keepGarden, setupSwitcher } from "../src/garden/switcher.js";
// A file beside this one, as text: the stylesheets the page links, read again for their tokens, and the plants'
// close studies.
const text = async (path) => (await fetch(new URL(path, import.meta.url))).text();
const [tokens, paint] = await Promise.all([text("../src/tokens.css"), text("../src/garden/paint.css")]);
const el = (tag, cls = "", text = "") => {
    const node = document.createElement(tag);
    if (cls)
        node.className = cls;
    if (text)
        node.textContent = text;
    return node;
};
// Token groups in the order tokens.css lists them, each token with its day value and its night
// value where the night set gives one.
const GROUPS = (() => {
    const block = (selector) => tokens.slice(tokens.indexOf(selector)).split("\n}")[0];
    const night = new Map([...block(':root[data-theme="dark"]').matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]));
    const groups = [];
    for (const line of block(":root {").split("\n")) {
        const title = line.match(/^\s*\/\* (.+) \*\/$/);
        if (title)
            groups.push({ title: title[1], items: [] });
        const decl = line.match(/^\s*(--[\w-]+):\s*([^;]+);/);
        if (decl && groups.length)
            groups.at(-1).items.push({ name: decl[1], day: decl[2], night: night.get(decl[1]) });
    }
    return groups;
})();
// The rules of paint.css that name a token, each with the classes a shape needs for it to apply.
const RULES = [...paint.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^}]*)\}/g)].flatMap(([, selectors, body]) => {
    const names = [...body.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]);
    return selectors.split(",").map((selector) => ({ classes: [...selector.trim().split(/\s+/).at(-1).matchAll(/\.([\w-]+)/g)].map((m) => m[1]), names }));
});
// A garden's palette: every token its drawings reach, directly (a shape's --pc) or through a
// paint rule their classes meet, and its plants' species. Paper and ink belong to every garden.
function reached(drawings, plants, water = false) {
    const text = drawings.join("");
    const classes = new Set([...text.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(" ")));
    if (water)
        ["water", "water-edge", "water-line"].forEach((c) => classes.add(c));
    const names = new Set([...text.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]));
    for (const plant of plants)
        names.add(`--pl-${plant.name}`);
    for (const rule of RULES)
        if (rule.classes.length && rule.classes.every((c) => c === "garden" || classes.has(c)))
            rule.names.forEach((n) => names.add(n));
    return names;
}
function renderPalette(host, names) {
    host.replaceChildren();
    for (const group of GROUPS) {
        const items = group.title === "Paper and ink" ? group.items : group.items.filter((token) => names.has(token.name));
        if (!items.length)
            continue;
        const grid = el("div", "swatches");
        for (const token of items) {
            const swatch = el("div", "swatch");
            const pair = el("span", "pair");
            for (const light of ["light", "light night"]) {
                const half = el("span", light);
                const color = /^(#|oklch)/.test(token.day);
                const chip = el("span", color ? "chip" : "chip value", color ? "" : light.includes("night") ? (token.night ?? token.day) : token.day);
                if (color)
                    chip.style.background = `var(${token.name})`;
                half.append(chip);
                pair.append(half);
            }
            swatch.append(pair, el("code", "name", token.name), el("span", "value", token.day), el("span", "value", token.night ? `night ${token.night}` : "the same by night"));
            grid.append(swatch);
        }
        host.append(el("h3", "", group.title), grid);
    }
}
function renderPen(host) {
    host.style.setProperty("--k", "1");
    const rows = [
        ["hair", "0.45 px, veins and texture"],
        ["thin", "0.8 px, the lit edge"],
        ["mid", "1.1 px, stems and growing tips"],
        ["thick", "1.6 px, the shadow edge"],
    ];
    host.innerHTML = rows
        .map(([cls, note]) => `<div class="stroke"><svg viewBox="0 0 220 24" aria-hidden="true"><path class="ink ${cls}" d="M6 14c30-10 52 6 80-2s50-8 74 0 36 4 54-4"/></svg><code>.ink.${cls}</code><span>${note}</span></div>`)
        .join("");
}
// Seven sample shifts of a species tone, the way individual leaves vary around it.
const SHIFTS = [
    [-0.06, -8, 0.9],
    [-0.03, 6, 1.1],
    [0, 0, 1],
    [0.03, -6, 0.95],
    [0.05, 9, 1.05],
    [-0.02, 12, 1.15],
    [0.04, -12, 0.85],
];
// A plant's whole drawing and its close study, by day and by night. The species class sits
// inside each light, so the plant's tone is read from that light's tokens. A plant of a garden
// that shows a year is shown in full leaf, late spring, without the parts of other seasons.
function renderPlant(plant, drawing, detail, year) {
    const card = el("article", "plant-card");
    const figures = el("div", "figures");
    for (const light of ["light", "light night"]) {
        const column = el("div", light);
        column.append(el("p", "label", light.includes("night") ? "Night" : "Day"));
        for (const [cls, svg] of [
            ["whole", drawing],
            ["detail", detail],
        ]) {
            const figure = el("figure", `${cls} g-${plant.name}`);
            figure.innerHTML = svg;
            if (year)
                for (const part of figure.querySelectorAll(".gp"))
                    if (+part.dataset.g > SPRING || +(part.dataset.d ?? Infinity) <= SPRING)
                        part.style.display = "none";
            column.append(figure);
        }
        const strip = el("div", `shifts g-${plant.name}`);
        for (const [dl, dh, dc] of SHIFTS) {
            const chip = el("span");
            chip.style.cssText = `--dl:${dl};--dh:${dh};--dc:${dc}`;
            strip.append(chip);
        }
        column.append(strip);
        figures.append(column);
    }
    const text = el("div", "text");
    text.append(el("h3", "", plant.common), el("p", "latin", plant.latin), el("p", "note", plant.note));
    const facts = el("dl");
    const materials = [...new Set([...drawing.matchAll(/--pc:var\((--[\w-]+)\)/g)].map((m) => m[1]))];
    for (const [term, value] of [
        ["Enters", plant.enters],
        ["Grows", plant.grows],
        ["Rank", String(plant.rank)],
        ["Tone", `--pl-${plant.name}`],
        ["Materials", materials.join(", ") || "none"],
    ]) {
        facts.append(el("dt", "", term), el("dd", "", value));
    }
    text.append(facts);
    card.append(text, figures);
    return card;
}
// Ink keeps one pen width at every size: --k is drawing units per CSS pixel. Each drawing is
// fitted inside its frame, so the tighter of the two directions sets the scale.
function scaleInk() {
    document.querySelectorAll(".plant-card figure").forEach((figure) => {
        const svg = figure.querySelector("svg");
        if (!svg || !svg.clientHeight)
            return;
        const { width, height } = svg.viewBox.baseVal;
        figure.style.setProperty("--k", Math.max(width / svg.clientWidth, height / svg.clientHeight).toFixed(3));
    });
}
const studyOf = (name) => text(`./details/${name}.svg`);
const drawingOf = (name) => fetch(`../garden/${name}.svg`).then((r) => r.text());
let garden = chosenGarden(GARDENS[0].key);
let showing = 0;
async function show() {
    const at = ++showing;
    const g = GARDENS.find((g) => g.key === garden);
    const plants = PLANTS.filter((plant) => plant.garden === garden).sort((a, b) => a.rank - b.rank);
    const [drawings, studies] = await Promise.all([Promise.all(plants.map((p) => drawingOf(p.name))), Promise.all(plants.map((p) => studyOf(p.name)))]);
    if (at !== showing)
        return;
    document.title = `${g.name} garden tokens`;
    document.querySelector("[data-garden-back]").href = `../?garden=${garden}`;
    const heading = document.querySelector("[data-garden-name]");
    heading.style.setProperty("--tone", `var(${g.tone})`);
    heading.innerHTML = `${emblem(g)}<span>${g.name} garden</span>`;
    renderPalette(document.querySelector("[data-palette]"), reached(drawings, plants, !!g.water));
    document.querySelector("[data-plants]").replaceChildren(...plants.map((plant, i) => renderPlant(plant, drawings[i], studies[i], !!g.year)));
    scaleInk();
}
setupSwitcher(document.querySelector("[data-garden-switch]"), document.querySelector("[data-garden-list]"), () => garden, (key) => {
    garden = key;
    keepGarden(key);
    show();
});
document.querySelectorAll("[data-pen]").forEach(renderPen);
show();
addEventListener("resize", scaleInk);
