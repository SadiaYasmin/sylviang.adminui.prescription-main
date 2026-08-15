import { toBanglaDigits } from './bangla-digits.util';

describe('toBanglaDigits', () => {
  it('converts each Arabic digit to its Bangla numeral', () => {
    expect(toBanglaDigits('0123456789')).toBe('০১২৩৪৫৬৭৮৯');
  });

  it('leaves non-digit characters unchanged', () => {
    expect(toBanglaDigits('RX-2026/34y')).toBe('RX-২০২৬/৩৪y');
  });

  it('returns an empty string for null/undefined', () => {
    expect(toBanglaDigits(null)).toBe('');
    expect(toBanglaDigits(undefined)).toBe('');
  });

  it('accepts a number input', () => {
    expect(toBanglaDigits(34)).toBe('৩৪');
  });
});
