// Epic M — Analytics & Reporting Dashboard (US-072–079). Field-for-field mirror of the
// backend's Application/Features/Analytics/Models/* response DTOs.

import { IHourBucket } from '@core/interfaces/doctors/doctor.interface';

export type AnalyticsGranularity = 'Day' | 'Week' | 'Month';

/** Date-range presets for the "Prescriptions" trend chart on the Medicine & Prescription tab. */
export type PrescriptionTrendRangePreset = 'Last7Days' | 'Last30Days' | 'Last3Months' | 'Custom';

export interface ITrendPoint {
  bucketKey: string;
  count: number;
}

export interface IMedicineCountEntry {
  name: string;
  count: number;
}

export interface ICategoryCountEntry {
  category: string;
  count: number;
}

export interface IDiagnosisCountEntry {
  diagnosis: string;
  count: number;
}

export interface ICoPrescribedPairEntry {
  medicineA: string;
  medicineB: string;
  pairLabel: string;
  count: number;
}

export interface IChronicDiagnosisEntry {
  patientId: number;
  patientName: string;
  diagnosis: string;
  occurrences: number;
}

export interface IDoctorCountEntry {
  doctorId: number;
  fullName: string;
  count: number;
}

// US-072
export interface IMedicineAnalyticsResponse {
  totalPrescriptions: number;
  totalMedicinesPrescribed: number;
  uniqueMedicinesPrescribed: number;
  avgMedicinesPerPrescription: number;
  topPrescribedMedicines: IMedicineCountEntry[];
  categoryBreakdown: ICategoryCountEntry[];
  rarelyUsedMedicines: IMedicineCountEntry[];
  coPrescribedPairs: ICoPrescribedPairEntry[];
}

// US-073 leaderboard
export interface IDoctorLeaderboardEntry {
  doctorId: number;
  fullName: string;
  patientsConsulted: number;
  prescriptionsCreated: number;
  medicinesPrescribed: number;
  avgRxPerConsultation: number;
  avgMedsPerRx: number;
}

// US-073, hospital-wide (all doctors) — reported in Bangladesh Time (UTC+6), always 24 entries
export interface IBusiestConsultationHoursResponse {
  hours: IHourBucket[];
}

// US-074 (also reused by US-072's embedded trend chart)
export interface IPrescriptionVolumeTrendResponse {
  granularity: AnalyticsGranularity;
  points: ITrendPoint[];
}

// US-075
export interface IPatientAnalyticsResponse {
  newPatients: number;
  returningPatients: number;
  newRegistrationTrend: ITrendPoint[];
  averageVisitsPerPatient: number;
  topDiagnoses: IDiagnosisCountEntry[];
  chronicDiagnosisPatterns: IChronicDiagnosisEntry[];
}

// US-076
export interface IMonthOverMonthMetric {
  current: number;
  previous: number;
  /** Null = no baseline (previous was 0, current > 0) — render as "New", not "0%". */
  percentChange: number | null;
}

export interface IExecutiveSummaryResponse {
  totalPatients: number;
  totalPrescriptions: number;
  totalMedicines: number;
  totalDoctors: number;
  totalStaff: number;
  prescriptionTrend: IMonthOverMonthMetric;
  newPatientTrend: IMonthOverMonthMetric;
  topMedicines: IMedicineCountEntry[];
  topDiagnoses: IDiagnosisCountEntry[];
  topActiveDoctors: IDoctorCountEntry[];
}

// US-077
export interface IMyDoctorAnalyticsResponse {
  ownPatientCount: number;
  patientsConsulted: number;
  draftPrescriptionCount: number;
  finalizedPrescriptionCount: number;
  assignedStaffCount: number;
  topMedicines: IMedicineCountEntry[];
}

// US-078
export interface IAssignedDoctorEntry {
  doctorId: number;
  fullName: string;
  department?: string | null;
}

export interface IMyStaffAnalyticsResponse {
  patientsRegisteredByMe: number;
  assignedDoctors: IAssignedDoctorEntry[];
}
