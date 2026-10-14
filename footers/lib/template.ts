// Templates with {{NAME}} holes.

// Fills each hole with its value, in the order given, so a value may itself carry a hole a later value fills.
// Values are inserted as they are: a "$" in a value is not a replacement pattern. No hole may be left.
export function fill(text: string, values: Record<string, string>, where: string): string {
  for (const [key, value] of Object.entries(values)) text = text.replaceAll(`{{${key}}}`, () => value);
  const left = text.indexOf("{{");
  if (left !== -1) throw new Error(`${where}: a hole is left unfilled: ${text.slice(left, left + 40)}`);
  return text;
}
