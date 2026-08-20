import { IPrescriptionDocument } from '@core/interfaces/prescriptions/prescription.interface';
import { AllergyPresetId } from '@core/interfaces/patients/patient.interface';
import { toBanglaDigits } from '@app/shared/utils/bangla-digits.util';
import { GENDER_LABELS_BN } from '@app/shared/utils/gender-labels.util';

// Backend serializes AllergyPresetEnum as its string name (global JSON string-enum
// converter), so these must be keyed by AllergyPresetId, not the enum's numeric value.
const ALLERGY_LABELS: Record<AllergyPresetId, string> = {
  None: 'None',
  Penicillin: 'Penicillin',
  Dust: 'Dust',
  Seafood: 'Seafood',
  Latex: 'Latex',
};

/** US-069: Bangla counterparts, shown only when rendering a Bangla-language prescription. */
const ALLERGY_LABELS_BN: Record<AllergyPresetId, string> = {
  None: 'নেই',
  Penicillin: 'পেনিসিলিন',
  Dust: 'ধুলা',
  Seafood: 'সামুদ্রিক খাবার',
  Latex: 'ল্যাটেক্স',
};

const BLOOD_GROUP_LABELS: Record<string, string> = {
  APositive: 'A+',
  ANegative: 'A-',
  BPositive: 'B+',
  BNegative: 'B-',
  ABPositive: 'AB+',
  ABNegative: 'AB-',
  OPositive: 'O+',
  ONegative: 'O-',
};

/**
 * Formats a patient snapshot into the plain display strings app-patient-info-block expects.
 *
 * `language` (US-067/068/069) is optional and defaults to English display — passing 'bn'
 * renders age/date in Bangla numerals, sex in Bangla, and known allergy presets in Bangla.
 * Blood group, phone, name, and rxNo are never digit-converted or translated: rxNo/phone are
 * identifiers/codes (not "read numbers"), and name/blood-group symbols aren't part of the
 * bilingual scope this phase covers.
 */
export function formatPatientInfoBlock(
  doc: IPrescriptionDocument,
  language: 'en' | 'bn' = 'en',
): {
  name: string;
  age: string;
  sex: string;
  phone: string;
  bloodGroup: string;
  allergies: string;
  date: string;
  rxNo: string;
} {
  const p = doc.patient;
  const isBn = language === 'bn';
  // English suffix is a terse "y"; Bangla spells out "বছর" (years) with a space, matching
  // the reference prototype (e.g. "৩৪ বছর", not "৩৪y").
  let years: number | null = null;
  if (p.dateOfBirth) {
    const dob = new Date(p.dateOfBirth);
    const now = new Date();
    years = now.getFullYear() - dob.getFullYear();
    const beforeBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
    if (beforeBirthday) years--;
  } else if (p.age != null) {
    years = p.age;
  }
  let age = '';
  if (years != null) {
    age = isBn ? `${toBanglaDigits(years)} বছর` : `${years}y`;
  }

  const allergyLabels = isBn ? ALLERGY_LABELS_BN : ALLERGY_LABELS;
  const allergies = p.allergyPresetId != null ? allergyLabels[p.allergyPresetId] || '—' : p.allergyOtherText || (isBn ? 'নেই' : 'None');

  const sex = isBn && p.gender ? GENDER_LABELS_BN[p.gender] || p.gender : p.gender || '';

  let date = doc.savedAt ? new Date(doc.savedAt).toLocaleDateString() : new Date().toLocaleDateString();
  if (isBn) date = toBanglaDigits(date);

  return {
    name: p.name,
    age,
    sex,
    phone: p.phone,
    bloodGroup: p.bloodGroup ? BLOOD_GROUP_LABELS[p.bloodGroup] || p.bloodGroup : '',
    allergies,
    date,
    rxNo: doc.displayCode,
  };
}
