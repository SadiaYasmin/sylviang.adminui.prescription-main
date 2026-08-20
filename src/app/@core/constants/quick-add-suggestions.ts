/**
 * Autocomplete suggestion lists for the Quick Add Preset manage form (Diagnosis /
 * Investigation / Advice / Follow-Up). Mirrors the reference prototype's
 * `src/data/clinicalPresets.js` + `quickAddInvestigationPresets.js`.
 *
 * These only pre-fill a native <datalist> — the doctor can always type a custom value and is
 * never forced to pick one. Advice/Follow-Up keep separate English/Bangla lists so each
 * bilingual field offers suggestions in its own language.
 */

export const DIAGNOSIS_SUGGESTIONS: string[] = [
  'Viral Fever',
  'Acute Pharyngitis',
  'Gastroenteritis',
  'Urinary Tract Infection',
  'Hypertension',
  'Type 2 Diabetes Mellitus',
  'Allergic Rhinitis',
  'Bronchial Asthma',
  'Migraine',
  'Osteoarthritis',
];

export const INVESTIGATION_SUGGESTIONS: string[] = [
  'CBC',
  'Blood Sugar (Random)',
  'Blood Sugar (Fasting)',
  'HbA1c',
  'Urine R/E',
  'Serum Creatinine',
  'Lipid Profile',
  'ECG',
  'Chest X-Ray',
  'USG Whole Abdomen',
];

export const ADVICE_SUGGESTIONS: { en: string[]; bn: string[] } = {
  en: [
    'Drink plenty of water',
    'Complete the full course of medication',
    'Avoid oily and spicy food',
    'Take adequate bed rest',
    'Follow a diabetic diet',
    'Avoid smoking',
    'Avoid heavy physical activity',
  ],
  bn: [
    'প্রচুর পরিমাণে পানি পান করুন',
    'সম্পূর্ণ কোর্স ওষুধ সেবন করুন',
    'তেল ও মসলাযুক্ত খাবার এড়িয়ে চলুন',
    'পর্যাপ্ত বিশ্রাম নিন',
    'ডায়াবেটিক ডায়েট মেনে চলুন',
    'ধূমপান থেকে বিরত থাকুন',
    'অতিরিক্ত পরিশ্রম এড়িয়ে চলুন',
  ],
};

export const FOLLOW_UP_SUGGESTIONS: { en: string[]; bn: string[] } = {
  en: ['Review after 7 days', 'Review after 14 days', 'Review after 1 month', 'Return if symptoms worsen'],
  bn: ['৭ দিন পর দেখাবেন', '১৪ দিন পর দেখাবেন', '১ মাস পর দেখাবেন', 'লক্ষণ বাড়লে আবার দেখাবেন'],
};
