import { IPrescriptionDocument } from '@core/interfaces/prescriptions/prescription.interface';
import { toBanglaDigits } from '@app/shared/utils/bangla-digits.util';
import { GENDER_LABELS_BN } from '@app/shared/utils/gender-labels.util';

const ALLERGY_LABELS: Record<number, string> = {
  1: 'None',
  2: 'Penicillin',
  3: 'Dust',
  4: 'Seafood',
  5: 'Latex',
};

/** US-069: Bangla counterparts, shown only when rendering a Bangla-language prescription. */
const ALLERGY_LABELS_BN: Record<number, string> = {
  1: 'নেই',
  2: 'পেনিসিলিন',
  3: 'ধুলা',
  4: 'সামুদ্রিক খাবার',
  5: 'ল্যাটেক্স',
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
  let age = '';
  if (p.dateOfBirth) {
    const dob = new Date(p.dateOfBirth);
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    const beforeBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
    if (beforeBirthday) years--;
    age = `${years}y`;
  } else if (p.age != null) {
    age = `${p.age}y`;
  }
  if (isBn && age) age = `${toBanglaDigits(age.slice(0, -1))}y`;

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
