/**
 * Predefined dropdown options for the Quick Add Medicine preset form's Dosage/Frequency/
 * Duration/Instructions fields — ported from the reference prototype's
 * `src/data/prescriptionPresets.js`/`src/data/advicePresets.js`. The admin preset form itself
 * has no language toggle (a preset is authored once, in English — same as the prototype's
 * `dosageId`/`frequencyId`/etc, which store a position, not per-language text). What IS
 * language-aware is *insertion*: when a doctor picks a Quick Add Medicine preset while
 * authoring a বাংলা prescription, `translatePresetText` below maps the preset's stored
 * English text to the Bangla text at the same list position — mirroring the prototype's
 * `resolveQuickAddMedicineField` (which resolves the same by numeric id instead of a string
 * lookup, since it stores an id; this codebase stores literal text, so position-matching a
 * flat string list achieves the same result without adding an id-indirection layer).
 */
export const DOSAGE_PRESETS: string[] = [
  '½ Tablet',
  '1 Tablet',
  '2 Tablets',
  '5 ml',
  '10 ml',
  '15 ml',
  '1 Capsule',
  '2 Capsules',
  '1 Puff',
  '2 Puffs',
  '1 Drop',
  '2 Drops',
  'Apply Thin Layer',
  'As Directed',
];

export const DOSAGE_PRESETS_BN: string[] = [
  '½ ট্যাবলেট',
  '১ ট্যাবলেট',
  '২ ট্যাবলেট',
  '৫ মিলি',
  '১০ মিলি',
  '১৫ মিলি',
  '১ ক্যাপসুল',
  '২ ক্যাপসুল',
  '১ পাফ',
  '২ পাফ',
  '১ ফোঁটা',
  '২ ফোঁটা',
  'পাতলা প্রলেপ লাগান',
  'নির্দেশ অনুযায়ী',
];

export const FREQUENCY_PRESETS: string[] = [
  'Once Daily (OD)',
  'Twice Daily (BD)',
  'Three Times Daily (TDS)',
  'Four Times Daily (QDS)',
  'Every Morning',
  'Every Night',
  'Every 6 Hours',
  'Every 8 Hours',
  'Every 12 Hours',
  'As Needed (PRN)',
];

export const FREQUENCY_PRESETS_BN: string[] = [
  'দিনে একবার (OD)',
  'দিনে দুইবার (BD)',
  'দিনে তিনবার (TDS)',
  'দিনে চারবার (QDS)',
  'প্রতিদিন সকালে',
  'প্রতিদিন রাতে',
  'প্রতি ৬ ঘণ্টা অন্তর',
  'প্রতি ৮ ঘণ্টা অন্তর',
  'প্রতি ১২ ঘণ্টা অন্তর',
  'প্রয়োজন অনুযায়ী (PRN)',
];

export const DURATION_PRESETS: string[] = [
  '1 Day',
  '3 Days',
  '5 Days',
  '7 Days',
  '10 Days',
  '14 Days',
  '21 Days',
  '1 Month',
  '2 Months',
  '3 Months',
  'Continue Until Review',
];

export const DURATION_PRESETS_BN: string[] = ['১ দিন', '৩ দিন', '৫ দিন', '৭ দিন', '১০ দিন', '১৪ দিন', '২১ দিন', '১ মাস', '২ মাস', '৩ মাস', 'পরবর্তী পর্যালোচনা পর্যন্ত চলবে'];

/** Ported from the prototype's `src/data/advicePresets.js` (used there for the same field). */
export const INSTRUCTIONS_PRESETS: string[] = ['Before meal', 'After meals', 'With food', 'Empty stomach', 'At bedtime', 'Before Breakfast', 'Before Lunch', 'Before Dinner'];

export const INSTRUCTIONS_PRESETS_BN: string[] = ['খাবারের আগে', 'খাবারের পরে', 'খাবারের সাথে', 'খালি পেটে', 'ঘুমানোর আগে', 'সকালের নাস্তার আগে', 'দুপুরের খাবারের আগে', 'রাতের খাবারের আগে'];

/** Sentinel option value that switches the Instructions field into free-text mode. */
export const CUSTOM_INSTRUCTIONS_VALUE = '__custom__';

/** Case/whitespace/trailing-period-insensitive, and tolerant of a missing/extra trailing
 *  "s" (so "After meal" matches "After meals") — legacy presets were free-typed before
 *  these fields became dropdowns, so their stored text rarely matches a preset byte-for-byte
 *  even when it's clearly the "same" option (different case, no trailing period, singular
 *  vs plural). Exact match still wins first; this only relaxes what counts as "the same". */
function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\.$/, '');
}

function findPresetIndex(text: string, en: string[]): number {
  const norm = normalize(text);
  const exact = en.findIndex((e) => normalize(e) === norm);
  if (exact >= 0) return exact;
  const relaxedNorm = norm.replace(/s$/, '');
  return en.findIndex((e) => normalize(e).replace(/s$/, '') === relaxedNorm);
}

/**
 * Position-matched EN→BN lookup for one field's stored (always-English) preset text.
 * Returns the English text unchanged if `language` is 'en', or if the text doesn't match
 * any known preset (e.g. a legacy value, or Instructions' free-typed "Custom" text) — there's
 * no translation for text that was never one of the fixed options, so it passes through as-is
 * rather than silently disappearing.
 */
function translate(text: string | null | undefined, en: string[], bn: string[], language: 'en' | 'bn'): string | null | undefined {
  if (!text || language !== 'bn') return text;
  const idx = findPresetIndex(text, en);
  return idx >= 0 ? bn[idx] : text;
}

export function translateDosage(text: string | null | undefined, language: 'en' | 'bn') {
  return translate(text, DOSAGE_PRESETS, DOSAGE_PRESETS_BN, language);
}

/**
 * Frequency gets one more fallback beyond the shared `translate()`: a legacy preset often
 * stored only the bare abbreviation ("OD", "TDS") rather than the full option text ("Once
 * Daily (OD)") — match against whatever's inside the parentheses of each option too.
 */
export function translateFrequency(text: string | null | undefined, language: 'en' | 'bn') {
  if (!text || language !== 'bn') return text;
  const direct = findPresetIndex(text, FREQUENCY_PRESETS);
  if (direct >= 0) return FREQUENCY_PRESETS_BN[direct];

  const norm = normalize(text);
  const byAbbreviation = FREQUENCY_PRESETS.findIndex((option) => {
    const match = option.match(/\(([^)]+)\)/);
    return !!match && normalize(match[1]) === norm;
  });
  return byAbbreviation >= 0 ? FREQUENCY_PRESETS_BN[byAbbreviation] : text;
}

export function translateDuration(text: string | null | undefined, language: 'en' | 'bn') {
  return translate(text, DURATION_PRESETS, DURATION_PRESETS_BN, language);
}

export function translateInstructions(text: string | null | undefined, language: 'en' | 'bn') {
  return translate(text, INSTRUCTIONS_PRESETS, INSTRUCTIONS_PRESETS_BN, language);
}

/** Full option list in the requested language — for rendering suggestions (e.g. a
 *  <datalist>), as opposed to `translate*` above which maps one already-chosen value. */
export function dosagePresetsFor(language: 'en' | 'bn'): string[] {
  return language === 'bn' ? DOSAGE_PRESETS_BN : DOSAGE_PRESETS;
}

export function frequencyPresetsFor(language: 'en' | 'bn'): string[] {
  return language === 'bn' ? FREQUENCY_PRESETS_BN : FREQUENCY_PRESETS;
}

export function durationPresetsFor(language: 'en' | 'bn'): string[] {
  return language === 'bn' ? DURATION_PRESETS_BN : DURATION_PRESETS;
}

export function instructionsPresetsFor(language: 'en' | 'bn'): string[] {
  return language === 'bn' ? INSTRUCTIONS_PRESETS_BN : INSTRUCTIONS_PRESETS;
}
