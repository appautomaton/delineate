// Contract implemented by every interactive specimen tile.

import type { Material } from "./physics.ts";
import type { SoundCue } from "./sound.ts";

export type TileContext = {
  /** Wakes the shared RAF scheduler when user input disturbs a settled tile. */
  wake(): void;
  /** Emits an optional tactile audio cue (muted unless Sound is enabled). */
  sound(cue: SoundCue, intensity?: number): void;
  /** Marks direct pointer/keyboard input so Loop choreography yields cleanly to the reader. */
  interact(): void;
};

export type TileInstance = {
  /** Root element mounted inside the tile's stage slot. */
  readonly el: Element;
  /** Advance simulation by `dt` seconds. Return `true` if still moving, `false` when settled. */
  step(dt: number, elapsed: number): boolean;
  /** Optional synthetic gesture driver invoked in Loop mode while the tile is not under user control. */
  demo(cycleTime: number, dt: number): void;
  /** Keyboard activation (Enter / Space) when the card itself has focus. */
  trigger(): void;
  /** Optional teardown hook. */
  destroy?(): void;
};

export type TileSpec = {
  readonly slug: string;
  readonly name: string;
  readonly material: Material;
  readonly hint: string;
  mount(ctx: TileContext): TileInstance;
};
