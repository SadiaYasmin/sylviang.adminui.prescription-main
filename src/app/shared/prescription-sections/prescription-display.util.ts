import { IPrescriptionDocument } from '@core/interfaces/prescriptions/prescription.interface';

const ALLERGY_LABELS: Record<number, string> = {
  1: 'None',
  2: 'Penicillin',
  3: 'Dust',
  4: 'Seafood',
  5: 'Latex',
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

/** Formats a patient snapshot into the plain display strings app-patient-info-block expects. */
export function formatPatientInfoBlock(doc: IPrescriptionDocument): {
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

  const allergies = p.allergyPresetId != null ? ALLERGY_LABELS[p.allergyPresetId] || '—' : p.allergyOtherText || 'None';

  return {
    name: p.name,
    age,
    sex: p.gender || '',
    phone: p.phone,
    bloodGroup: p.bloodGroup ? BLOOD_GROUP_LABELS[p.bloodGroup] || p.bloodGroup : '',
    allergies,
    date: doc.savedAt ? new Date(doc.savedAt).toLocaleDateString() : new Date().toLocaleDateString(),
    rxNo: doc.displayCode,
  };
}
