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
  photoBase64?: string | null;
}

export interface ICreateDoctorRequest extends IDoctorProfileFields {
  username: string;
  email?: string | null;
}

export interface ICreateDoctorResponse {
  doctorId: number;
  userId: number;
  username: string;
  temporaryPassword: string;
}

export interface IUpdateDoctorRequest extends IDoctorProfileFields {
  email?: string | null;
  isActive: boolean;
}

export interface IDoctorSummary extends IDoctorProfileFields {
  doctorId: number;
  userId: number;
  username: string;
  email?: string | null;
  isActive: boolean;
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
  recentPrescriptions: IDoctorRecentPrescription[];
  activityTrend: IDoctorActivityTrendPoint[];
}

export interface IDoctorDetailsResponse {
  profile: IDoctorSummary;
  performance: IDoctorPerformanceStats;
}
