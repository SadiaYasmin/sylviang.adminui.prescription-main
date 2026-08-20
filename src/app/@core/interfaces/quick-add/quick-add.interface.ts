import { translateDosage, translateDuration, translateFrequency, translateInstructions } from '@core/constants/quick-add-medicine-presets';
import { toBanglaDigits } from '@app/shared/utils/bangla-digits.util';

export type QuickAddSectionType = 'Medicine' | 'Diagnosis' | 'Investigation' | 'Advice' | 'FollowUp';

export interface IQuickAddPreset {
  quickAddPresetId: number;
  sectionType: QuickAddSectionType;
  label: string;
  payloadJson: string;
}

export interface IAddQuickAddPresetRequest {
  sectionType: QuickAddSectionType;
  label: string;
  payloadJson: string;
}

/** SectionType is immutable on edit — see backend UpdateQuickAddPresetRequest for why. */
export interface IUpdateQuickAddPresetRequest {
  label: string;
  payloadJson: string;
}

export type IAdvicePhraseDictionary = Record<string, string>;

/**
 * "Review after N days." is by far the most common Follow-Up phrase, but the backend's
 * known-phrase dictionary (AdviceFollowUpPhraseDictionary.cs) only has a single literal
 * entry for "review after 7 days." — any other day count (15, 3, 10, ...) missed the exact
 * match entirely and the doctor saw বাংলা stay blank even though this is a completely
 * mechanical translation (just swap the digit and localize it). Generalizing this ONE
 * pattern client-side covers the actual reported case without touching the backend's
 * intentionally-small literal dictionary.
 */
const DAY_COUNT_PATTERN = /^review after (\d+)\s*days?\.?$/i;

/** Exact dictionary match first, then the day-count pattern; null if neither applies. */
export function resolveKnownPhraseTranslation(en: string | null | undefined, dictionary: IAdvicePhraseDictionary): string | null {
  const key = (en || '').trim().toLowerCase();
  if (!key) return null;
  if (dictionary[key]) return dictionary[key];

  const match = key.match(DAY_COUNT_PATTERN);
  return match ? `${toBanglaDigits(match[1])} দিন পর পুনরায় দেখাবেন।` : null;
}

export type QuickAddPayloadShape = 'medicine' | 'diagnosis' | 'text' | 'bilingual';

/**
 * There's no separate "Label" the doctor types — the preset's own content IS its
 * identifier, exactly like the reference prototype (which has no label field at all).
 * `payload` is whatever the payload-shape's own form fields produced (untyped here
 * since callers already know the shape from `IQuickAddSectionOption.payloadShape`).
 */
export function derivePresetLabel(payloadShape: QuickAddPayloadShape, payload: Record<string, unknown>): string {
  switch (payloadShape) {
    case 'medicine':
      return [payload['medicine'], payload['strength']].filter(Boolean).join(' ');
    case 'diagnosis':
      return payload['icd10'] ? `${payload['text']} (${payload['icd10']})` : String(payload['text'] || '');
    case 'bilingual':
      return String(payload['en'] || payload['bn'] || '');
    case 'text':
    default:
      return String(payload['text'] || '');
  }
}

interface IMedicinePresetPayload {
  medicine?: string;
  strength?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

/**
 * The "Quick Add [X]" picker's own option text while authoring.
 *
 * - **Medicine** shows the *full* preset detail line — identity plus dosage/frequency/
 *   duration/instructions, joined with " • " — matching the reference prototype's
 *   `getOptionLabel` override in `MedicineRenderer.jsx` (a doctor picking from several
 *   saved medicines needs to see the dosing before picking, not just the drug name). The
 *   four dosing fields are translated to বাংলা via the same `translate*` helpers
 *   `addMedicinePreset()` uses on insert, so the preview always matches what actually
 *   gets inserted.
 * - **Diagnosis/Investigation** identity stays English always (ICD codes/clinical terms,
 *   not translated content — same rule as the avro-typing scope this session established),
 *   so they just use the preset's stored `label`.
 * - **Advice/FollowUp** presets store BOTH `en` and `bn` (bilingual payload shape) — when
 *   the prescription is currently বাংলা, show the Bangla phrasing in the dropdown too
 *   (matching the prototype's `pickText`/`getOptionLabel`), not the English label that was
 *   merely computed once at save time.
 */
export function resolveQuickAddOptionLabel(preset: IQuickAddPreset, language: 'en' | 'bn'): string {
  if (preset.sectionType === 'Medicine') {
    try {
      const payload = JSON.parse(preset.payloadJson) as IMedicinePresetPayload;
      const identity = [payload.medicine, payload.strength].filter(Boolean).join(' ');
      const parts = [
        identity,
        translateDosage(payload.dosage, language),
        translateFrequency(payload.frequency, language),
        translateDuration(payload.duration, language),
        translateInstructions(payload.instructions, language),
      ].filter(Boolean);
      return parts.length ? parts.join(' • ') : preset.label;
    } catch {
      return preset.label;
    }
  }

  if (preset.sectionType !== 'Advice' && preset.sectionType !== 'FollowUp') return preset.label;
  try {
    const payload = JSON.parse(preset.payloadJson) as { en?: string; bn?: string };
    return (language === 'bn' ? payload.bn || payload.en : payload.en) || preset.label;
  } catch {
    return preset.label;
  }
}
