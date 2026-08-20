const ARABIC_TO_BANGLA_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

const BANGLA_TO_ARABIC_DIGITS: Record<string, string> = Object.fromEntries(
  Object.entries(ARABIC_TO_BANGLA_DIGITS).map(([ascii, bangla]) => [bangla, ascii]),
);

/** US-067: converts Arabic numerals (0-9) to Bangla numerals (০-৯). Non-digit characters pass through unchanged. */
export function toBanglaDigits(value: string | number | null | undefined): string {
  if (value == null) return '';
  return String(value).replace(/[0-9]/g, (digit) => ARABIC_TO_BANGLA_DIGITS[digit]);
}

/**
 * Inverse of {@link toBanglaDigits} — converts Bangla numerals (০-৯) back to Arabic (0-9).
 * Used so numeric vitals fields can *display* Bangla numerals while the value stored/emitted
 * stays plain ASCII (BMI and any other parsing can't read Bangla numerals). Mirrors the
 * reference prototype's `toAsciiDigits`.
 */
export function toAsciiDigits(value: string | number | null | undefined): string {
  if (value == null) return '';
  return String(value).replace(/[০-৯]/g, (digit) => BANGLA_TO_ARABIC_DIGITS[digit]);
}
