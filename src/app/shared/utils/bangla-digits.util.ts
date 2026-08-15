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

/** US-067: converts Arabic numerals (0-9) to Bangla numerals (০-৯). Non-digit characters pass through unchanged. */
export function toBanglaDigits(value: string | number | null | undefined): string {
  if (value == null) return '';
  return String(value).replace(/[0-9]/g, (digit) => ARABIC_TO_BANGLA_DIGITS[digit]);
}
