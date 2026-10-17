// What the rain is written in: any run of characters. The default is the hiragana with the kanji that
// carry the rain radical; a page may pass its own, a line of a poem as readily as an alphabet.

const span = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)).join("");

export const SETS: Record<string, string> = {
  kana: span(0x3042, 0x3093),
  rain: "雨雫零雪雲電霞霜霧露霖霏霙霰靄",
  latin: "abcdefghijklmnopqrstuvwxyz",
};

export const DEFAULT = SETS.kana + SETS.rain;

/** A text's characters, each once, whitespace left out. */
export const characters = (text: string): string[] => [...new Set(Array.from(text).filter((c) => c.trim()))];

// A hand that writes kana and kanji, then whatever the system holds for the rest.
export const FONT = '"Zen Kurenaido", "Klee", "Kaiti SC", "STKaiti", "KaiTi", "Hiragino Mincho ProN", serif';
