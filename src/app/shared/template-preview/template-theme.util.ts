/**
 * Small colour helpers so a template's single configurable accent colour can drive a
 * whole tint family (soft section backgrounds, hairline borders) without asking the
 * admin to pick each shade by hand. Kept dependency-free and deterministic so the
 * rendered preview matches the printed output exactly.
 */

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHex(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace('#', '');
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return [r, g, b];
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

/**
 * Mixes `hex` toward `target` by `amount` (0..1) and returns an `rgb(...)` string.
 * Returns the original string unchanged if it can't be parsed, so an invalid config
 * value never blanks out the template.
 */
export function mixColor(hex: string, amount: number, target: [number, number, number] = [255, 255, 255]): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  const [tr, tg, tb] = target;
  return `rgb(${clamp(r + (tr - r) * amount)}, ${clamp(g + (tg - g) * amount)}, ${clamp(b + (tb - b) * amount)})`;
}

/** Very light tint of the accent — used for the patient block / footer background. */
export function softTint(hex: string): string {
  return mixColor(hex, 0.92);
}

/** A muted hairline shade of the accent — used for section underlines / borders. */
export function lineTint(hex: string): string {
  return mixColor(hex, 0.55);
}
