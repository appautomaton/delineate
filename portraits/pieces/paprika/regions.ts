// The regions of the scene. A region is the backdrop, a thing, or a part of a thing; each is traced
// or modeled on its own and becomes one group in the SVG. Region maps (see trace/labels.ts) name
// one region per pixel; the backdrop comes first, so unpainted means backdrop.

import type { TraceStyle } from "../../harness/trace/layer.ts";
import { type Balloon, BACKDROP_TRACE, LAYERS, TRACE } from "./scene.ts";

export type Region = {
  name: string; // also its id in the SVG
  layer: number; // index into LAYERS
  trace: TraceStyle;
  inside?: string; // the region whose group holds this one
  moves?: string; // how it moves as a whole, by the motion's class
  balloon?: Balloon;
};

// Every region, back to front, as the scene declares them.
export function declared(): Region[] {
  const out: Region[] = [{ name: "backdrop", layer: 0, trace: BACKDROP_TRACE }];
  LAYERS.forEach((layer, l) => {
    for (const thing of layer.things) {
      const trace = { ...TRACE, ...thing.trace };
      if (!thing.parts) out.push({ name: thing.name, layer: l, trace, moves: thing.moves, balloon: thing.balloon });
      else
        for (const part of thing.parts)
          out.push({ name: `${thing.name}-${part.name}`, layer: l, trace: { ...trace, ...part.trace }, inside: part.inside && `${thing.name}-${part.inside}`, moves: part.moves });
    }
  });
  return out;
}
