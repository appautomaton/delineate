// The glass on a WebGL2 canvas: the shader (shader.ts) over one triangle that covers the canvas, and two slots
// for pages, each a distance field (field.ts) held as a half-float texture: the page shown, and the one it is
// melting into or will melt into next.
import { FRAGMENT, SHAPES, VERTEX } from "./shader.js";
export class Glass {
    #gl;
    #u;
    #slots;
    #w = 1;
    #h = 1;
    #dpr = 1;
    constructor(canvas) {
        const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false });
        if (!gl)
            throw new Error("WebGL2 is not available");
        this.#gl = gl;
        const program = gl.createProgram();
        for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
            const s = gl.createShader(type);
            gl.shaderSource(s, source);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
                throw new Error(gl.getShaderInfoLog(s) ?? "shader failed");
            gl.attachShader(program, s);
        }
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(program) ?? "link failed");
        gl.useProgram(program);
        // one triangle larger than the canvas covers every pixel of it
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const at = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(at);
        gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
        this.#u = Object.fromEntries(["uPageFrom", "uPageTo", "uFlow", "uStage", "uDpr", "uCenter", "uSize", "uTurn", "uFrom", "uTo", "uMelt", "uNight", "uPaper", "uInk"].map((n) => [n, gl.getUniformLocation(program, n)]));
        this.#slots = [0, 1].map(() => {
            const t = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, t);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            return t;
        });
        gl.uniform1i(this.#u.uPageFrom, 0);
        gl.uniform1i(this.#u.uPageTo, 1);
    }
    /** Sizes the canvas to a stage `w` by `h` CSS pixels at `dpr`. */
    size(w, h, dpr) {
        const gl = this.#gl;
        [this.#w, this.#h, this.#dpr] = [w, h, dpr];
        gl.canvas.width = Math.round(w * dpr);
        gl.canvas.height = Math.round(h * dpr);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
    /** Puts a page's distance field, `w` by `h` pixels, in slot 0 or 1. */
    page(slot, field, w, h) {
        const gl = this.#gl;
        gl.activeTexture(gl.TEXTURE0 + slot);
        gl.bindTexture(gl.TEXTURE_2D, this.#slots[slot]);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, w, h, 0, gl.RED, gl.FLOAT, field);
    }
    draw(f) {
        const gl = this.#gl, u = this.#u;
        for (const unit of [0, 1]) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, this.#slots[f.pages[unit]]);
        }
        gl.uniform1f(u.uFlow, f.flow);
        gl.uniform2f(u.uStage, this.#w, this.#h);
        gl.uniform1f(u.uDpr, this.#dpr);
        gl.uniform3f(u.uCenter, ...f.center);
        gl.uniform1f(u.uSize, f.size);
        gl.uniformMatrix3fv(u.uTurn, false, f.turn);
        gl.uniform1i(u.uFrom, SHAPES.indexOf(f.from));
        gl.uniform1i(u.uTo, SHAPES.indexOf(f.to));
        gl.uniform1f(u.uMelt, f.melt);
        gl.uniform1f(u.uNight, f.night);
        gl.uniform3f(u.uPaper, ...f.paper);
        gl.uniform3f(u.uInk, ...f.ink);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}
