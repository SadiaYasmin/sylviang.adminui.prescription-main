export type DoctorGender = 'Male' | 'Female' | 'Other';

export interface IDoctorProfileFields {
  fullName: string;
  phone: string;
  qualification?: string | null;
  department?: string | null;
  licenseNumber?: string | null;
  specialization?: string | null;
  experienceYears?: number | null;
  gender?: DoctorGender | null;
  joiningDate?: string | null;
}

/**
 * US-083: photo is base64 on the way in (a new upload), but a stored URL on the way out —
 * so it's added separately to the request/response interfaces below rather than living on
 * the shared IDoctorProfileFields.
 */
export interface ICreateDoctorRequest extends IDoctorProfileFields {
  username: string;
  email: string;
  photoBase64?: string | null;
}

export interface ICreateDoctorResponse {
  doctorId: number;
  userId: number;
  username: string;
}

export interface IUpdateDoctorRequest extends IDoctorProfileFields {
  email?: string | null;
  isActive: boolean;
  photoBase64?: string | null;
}

export interface IDoctorSummary extends IDoctorProfileFields {
  doctorId: number;
  userId: number;
  username: string;
  email?: string | null;
  isActive: boolean;
  photoUrl?: string | null;
}

export interface IDoctorListRequest {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  department?: string;
  isActive?: boolean;
}

export interface IDoctorListSummary {
  totalDoctors: number;
  activeDoctors: number;
  totalPrescriptions: number;
  totalMedicineEntries: number;
}

export interface IDoctorListResponse {
  doctors: IDoctorSummary[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  summary: IDoctorListSummary;
}

export interface IDoctorTopMedicine {
  name: string;
  count: number;
}

export interface IDoctorRecentPrescription {
  prescriptionId: string;
  patientName: string;
  diagnosis?: string | null;
  date: string;
}

export interface IDoctorActivityTrendPoint {
  period: string;
  count: number;
}

export interface IDoctorPerformanceStats {
  totalPatientsConsulted: number;
  totalPrescriptions: number;
  todayPrescriptions: number;
  thisMonthPrescriptions: number;
  avgPrescriptionsPerConsultation: number;
  avgMedicinesPerPrescription: number;
  totalMedicinesPrescribed: number;
  topMedicines: IDoctorTopMedicine[];
  /** Every medicine this doctor has ever prescribed, sorted by count descending — never truncated, unlike topMedicines. */
  allMedicines: IDoctorTopMedicine[];
  recentPrescriptions: IDoctorRecentPrescription[];
  activityTrend: IDoctorActivityTrendPoint[];
  /** US-073: 24-hour histogram (Hour 0–23) of this doctor's consultation check-in times, Bangladesh Time. */
  busiestHours: IHourBucket[];
}

export interface IHourBucket {
  hour: number;
  count: number;
}

export interface IDoctorDetailsResponse {
  profile: IDoctorSummary;
  performance: IDoctorPerformanceStats;
}

/** A staff member's own "assigned to me" view of doctors — list row shape. */
export interface IAssignedDoctorListItem {
  doctorId: number;
  fullName: string;
  department?: string | null;
  phone: string;
  isActive: boolean;
}

/**
 * A staff member's read-only detail view of one assigned doctor — deliberately not the full
 * Admin IDoctorDetailsResponse (no prescribing analytics), just identity/contact fields plus
 * two counts.
 */
export interface IAssignedDoctorDetails {
  doctorId: number;
  fullName: string;
  specialization?: string | null;
  department?: string | null;
  email?: string | null;
  phone: string;
  isActive: boolean;
  photoUrl?: string | null;
  /** Null for assignments made before this field started being tracked. */
  assignedDate?: string | null;
  todayAppointments: number;
  completedConsultations: number;
}
