/**
 * US-069: a fixed suggestion list for the free-text "Other allergy" field — offered as
 * autocomplete, never enforced (the field stays free text; a doctor/staff member can always
 * type something not on this list). Same non-enforcing pattern as Quick Add presets. `bn` is
 * seed data for a future bilingual admin UI — only `en` is wired into the form today, since
 * the rest of the admin UI stays English regardless of a given prescription's language
 * (see GENDER_LABELS_BN's doc comment for why).
 */
export const ALLERGY_OTHER_SUGGESTIONS: { en: string; bn: string }[] = [
  { en: 'Aspirin', bn: 'অ্যাসপিরিন' },
  { en: 'Sulfa drugs', bn: 'সালফা ওষুধ' },
  { en: 'NSAIDs', bn: 'এনএসএআইডি' },
  { en: 'Iodine', bn: 'আয়োডিন' },
  { en: 'Shellfish', bn: 'শামুক-ঝিনুক জাতীয় খাবার' },
  { en: 'Peanuts', bn: 'চিনাবাদাম' },
  { en: 'Egg', bn: 'ডিম' },
  { en: 'Milk/Dairy', bn: 'দুধ/দুগ্ধজাত খাবার' },
  { en: 'Pollen', bn: 'পরাগরেণু' },
  { en: 'Insect sting', bn: 'পোকামাকড়ের কামড়' },
];
