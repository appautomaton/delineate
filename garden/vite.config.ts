import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// index.html placeholder: <!-- garden --> becomes one empty bed per plant in
// src/garden/plants.json, in paint order and marked with its garden.
const page = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Two pages: the garden, and the token gallery at /gallery/.
export default defineConfig({
  build: { rollupOptions: { input: { garden: page("./index.html"), gallery: page("./gallery/index.html") } } },
  plugins: [
    {
      name: "garden",
      transformIndexHtml: (html) => {
        const plants: { name: string; garden: string }[] = JSON.parse(readFileSync(new URL("./src/garden/plants.json", import.meta.url), "utf8"));
        return html.replace("<!-- garden -->", plants.map(({ name, garden }) => `<div class="plant g-${name}" data-plant="${name}" data-garden="${garden}"></div>`).join("\n      "));
      },
    },
  ],
});
