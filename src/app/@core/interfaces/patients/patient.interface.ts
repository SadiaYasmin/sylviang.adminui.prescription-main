export type PatientGender = 'Male' | 'Female' | 'Other';

export type BloodGroup = 'APositive' | 'ANegative' | 'BPositive' | 'BNegative' | 'ABPositive' | 'ABNegative' | 'OPositive' | 'ONegative';

// No enum value exists for "Other" — when the user picks "Other" in the UI, allergyPresetId
// must be sent as null and allergyOtherText carries the free-text value instead.
export type AllergyPresetId = 'None' | 'Penicillin' | 'Dust' | 'Seafood' | 'Latex';

export interface IPatientProfileFields {
  name: string;
  phone: string;
  dateOfBirth?: string | null;
  age?: number | null;
  gender?: PatientGender | null;
  address?: string | null;
  bloodGroup?: BloodGroup | null;
  allergyPresetId?: AllergyPresetId | null;
  allergyOtherText?: string | null;
  // Populated later by prescription finalization (a future epic) — read-only wire field,
  // never sent by this epic's create/update form.
  savedHistory?: string | null;
}

export interface ICreatePatientRequest extends IPatientProfileFields {}

export interface IUpdatePatientRequest extends IPatientProfileFields {}

export interface IPatientSummary extends IPatientProfileFields {
  patientId: number;
  registeredByStaffId: number;
  // Always present in the payload regardless of caller role — the UI decides whether to render it.
  registeredByName: string;
  registeredAt: string;
}

export interface IPatientListRequest {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export interface IPatientListResponse {
  patients: IPatientSummary[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface IPatientDetailsResponse {
  profile: IPatientSummary;
}
