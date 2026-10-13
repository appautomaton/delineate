// The page's words and colors for the 3D multiplane separation stage (see portraits/harness/stage/page.ts).

import type { Page } from "../../harness/stage/page.ts";

export const PAGE: Page = {
  title: "Wavy-Line Engraving, Apart",
  description: "A city-street portrait engraved in level wavy lines across six depth planes. Pull the plates apart to see each layer on its own cel.",
  eyebrow: "d3lin3at3 · A layered engraving",
  heading: "In wavy lines, <em>apart</em>",
  intro:
    "A street portrait engraved in one family of level wavy lines across six plates, back to front: sky, towers, plaza, street trees, the young man, and the branch overhead. Move the pointer to shift the planes in parallax; drag the slider to spread the stacked plates apart.",
  label:
    "At rest the six plates register into one print on warm paper. Pulled apart, each cel shows how its plate carries the scene underneath the layers in front: the plaza recedes to the horizon, the canopy opens to the towers behind, and his jacket is cut from a single wave field.",
  alt: "A young man in a leather jacket smiling in a city street, engraved in dark green and navy wavy lines on warm cream paper",
  theme: { ground: "#0b0d0c", ink: "#f3e8cc", mid: "#b9b09a", dim: "#7d7767", accent: "#c87d4b" },
  settings: { gap: 0.115 },
};
