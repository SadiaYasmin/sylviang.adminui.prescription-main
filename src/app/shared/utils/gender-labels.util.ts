/**
 * US-068: Bangla labels for the fixed Male/Female/Other vocabulary, used only when
 * rendering a Bangla-language prescription (see formatPatientInfoBlock). The rest of the
 * admin UI (doctor/patient forms, gender dropdowns) stays English regardless of any given
 * prescription's language — this is a prescription-rendering concern, not an app-locale
 * switch, matching how templates are per-template-language rather than whole-app-language.
 */
export const GENDER_LABELS_BN: Record<string, string> = {
  Male: 'পুরুষ',
  Female: 'মহিলা',
  Other: 'অন্যান্য',
};
