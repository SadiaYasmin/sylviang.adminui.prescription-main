import { ConsultationStatus } from '@core/interfaces/consultations/consultation.interface';

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
  /** Optional date range — e.g. carried as navigation context from an Analytics KPI card. Meaning depends on `newOnly`/`returningOnly` (see their doc comments); with neither set, filters by registration date instead. */
  from?: string;
  to?: string;
  /** True: only patients with exactly one consultation inside `from`/`to` — "New Patients" drill-down from the Patient Analytics tab (visit-count based, registration date irrelevant). */
  newOnly?: boolean;
  /** True: only patients with more than one consultation inside `from`/`to` — "Returning Patients" drill-down from the Patient Analytics tab (visit-count based, registration date irrelevant). */
  returningOnly?: boolean;
  /** Doctor-only. True: only patients the logged-in doctor had a Completed consultation with inside `from`/`to` (or ever, if both omitted) — the Doctor Dashboard's "Patients Consulted" drill-down. */
  completedWithMeOnly?: boolean;
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

export type PatientQueueFilter = 'TodayQueue' | 'AllRegistered' | 'NotConsultedToday' | 'CompletedToday';

export interface IDoctorPatientQueueRequest {
  queueFilter: PatientQueueFilter;
  searchTerm?: string;
}

export interface IDoctorPatientQueueItem extends IPatientSummary {
  // Null when the patient has no consultation record with this doctor today at all.
  todayConsultationId?: number | null;
  todayConsultationStatus?: ConsultationStatus | null;
  // Only ever set when todayConsultationStatus is 'Completed'.
  todayPrescriptionId?: number | null;
  // True once today's linked prescription has ever been explicitly "Save as Draft"-ed —
  // independent of todayConsultationStatus, which flips back to InConsultation on reopen.
  todayHasSavedDraft?: boolean;
}

export interface IDoctorPatientQueueResponse {
  patients: IDoctorPatientQueueItem[];
}
