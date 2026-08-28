import { IPrescriptionListItem } from '@core/interfaces/prescriptions/prescription.interface';

export type ConsultationStatus = 'Waiting' | 'InConsultation' | 'Completed' | 'Draft';

export type ConsultationDateMode = 'Today' | 'Yesterday' | 'Custom' | 'Range' | 'All';

export interface ICreateConsultationRequest {
  patientId: number;
  doctorId: number;
  visitDate?: string | null;
  /** Retained for API compatibility; duplicate active consultations are never overridden. */
  force?: boolean;
}

export interface IConsultationSummary {
  consultationId: number;
  displayCode: string;
  tokenNumber: string;
  status: ConsultationStatus;
}

export interface ICreateConsultationResponse {
  duplicateFound: boolean;
  consultation?: IConsultationSummary | null;
  existingConsultation?: IConsultationSummary | null;
  unfinishedDraftFound: boolean;
  unfinishedDrafts: IPrescriptionListItem[];
}

export interface IOpenConsultationResponse {
  consultationId: number;
  displayCode: string;
  tokenNumber: string;
  status: string;
  visitDate: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
}

export interface IQueueItem {
  consultationId: number;
  displayCode: string;
  tokenNumber: string;
  status: ConsultationStatus;
  checkInAt: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  // True once the linked prescription has ever been explicitly "Save as Draft"-ed —
  // independent of status, which flips back to InConsultation on reopen.
  hasSavedDraft: boolean;
}

export interface IAssignedDoctorSummary {
  doctorId: number;
  fullName: string;
}

export interface IConsultationListRequest {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  dateMode?: ConsultationDateMode;
  date?: string;
  fromDate?: string;
  toDate?: string;
  doctorId?: number;
  status?: ConsultationStatus;
}

export interface IConsultationListItem {
  consultationId: number;
  displayCode: string;
  tokenNumber: string;
  status: string;
  visitDate: string;
  checkInAt: string;
  patientId: number;
  patientName: string;
  patientPhone: string;
  doctorId: number;
  doctorName: string;
}

export interface IConsultationListSummary {
  total: number;
  waiting: number;
  inProgress: number;
  completed: number;
  draft: number;
}

export interface IConsultationListResponse {
  consultations: IConsultationListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  summary: IConsultationListSummary;
}

export interface IConsultationDetailsResponse {
  consultationId: number;
  displayCode: string;
  tokenNumber: string;
  status: string;
  visitDate: string;
  checkInAt: string;
  patientId: number;
  patientName: string;
  patientPhone: string;
  doctorId: number;
  doctorName: string;
  registeredByStaffId: number;
  registeredByName: string;
}
