// A specimen sheet of the pointers: every shape in a few of the hands' colours, enlarged and at size, on light
// and dark paper, so a change to a shape is judged where it will be seen.
import { Pointer } from "../../hand/pointer.js";
const SHAPES = ["arrow", "pen", "cross", "text", "move", "resize"];
const COLOURS = ["#2F4FB8", "#CF3F2C", "#D9A532", "#4C7E37", "#DE7C93", "#6B55B3"];
const sheet = document.querySelector(".sheet");
function row(label, cls, each) {
    const r = document.createElement("div");
    r.className = `row ${cls}`;
    r.innerHTML = `<span>${label}</span>`;
    SHAPES.forEach((shape, i) => {
        const cell = document.createElement("div");
        cell.className = "cell";
        each(cell, shape, i);
        r.append(cell);
    });
    sheet.append(r);
}
const put = (cell, shape, colour, tagged = false) => {
    const p = new Pointer(cell, colour, "ink-04", -2);
    p.shape = shape;
    p.tagged = tagged;
    p.el.style.transform = "";
};
for (const colour of COLOURS.slice(0, 2))
    row(`× 4  ${colour}`, "big", (cell, shape) => put(cell, shape, colour));
for (const colour of COLOURS)
    row(`× 1  ${colour}`, "", (cell, shape) => put(cell, shape, colour));
row("× 1  night", "dark", (cell, shape, i) => put(cell, shape, COLOURS[i]));
row("tagged", "", (cell, shape, i) => put(cell, shape, COLOURS[i], true));
