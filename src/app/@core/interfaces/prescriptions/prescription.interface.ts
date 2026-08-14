import { ITemplateConfig, TemplateType } from '@core/interfaces/templates/template.interface';

export type PrescriptionStatus = 'Draft' | 'Finalized';
export type PrescriptionLanguage = 'En' | 'Bn';

export interface IExamination {
  bp: string | null;
  pulse: string | null;
  temperature: string | null;
  respiratoryRate: string | null;
  spo2: string | null;
  weight: string | null;
  height: string | null;
  bloodSugar: string | null;
  painScore: string | null;
  heartRate: string | null;
}

export const blankExamination = (): IExamination => ({
  bp: null,
  pulse: null,
  temperature: null,
  respiratoryRate: null,
  spo2: null,
  weight: null,
  height: null,
  bloodSugar: null,
  painScore: null,
  heartRate: null,
});

export interface IDiagnosisItem {
  text: string;
  icd10?: string | null;
}

export interface IMedicineItem {
  medicine: string;
  generic?: string | null;
  strength: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export interface IPrescriptionContent {
  chiefComplaints: string[];
  history: string[];
  examination: IExamination;
  diagnoses: IDiagnosisItem[];
  investigations: string[];
  medicines: IMedicineItem[];
  advice: string[];
  followUp: string | null;
}

export const blankPrescriptionContent = (): IPrescriptionContent => ({
  chiefComplaints: [],
  history: [],
  examination: blankExamination(),
  diagnoses: [],
  investigations: [],
  medicines: [],
  advice: [],
  followUp: null,
});

export interface IPatientSnapshot {
  patientId: number;
  name: string;
  phone: string;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  bloodGroup: string | null;
  allergyPresetId: number | null;
  allergyOtherText: string | null;
  savedHistory: string | null;
}

export interface IDoctorSnapshot {
  doctorId: number;
  fullName: string;
  qualification: string | null;
  department: string | null;
  licenseNumber: string | null;
  signatureBase64: string | null;
  preferredTemplateId: number | null;
}

export interface IHospitalSettingsSnapshot {
  name: string;
  logoBase64: string | null;
  address: string;
  phone: string;
  emergencyNumber: string | null;
  website: string | null;
  slogan: string | null;
  sloganBn: string | null;
  licenseNumber: string | null;
  sealBase64: string | null;
}

export interface IPrescriptionDocument {
  prescriptionId: number;
  displayCode: string;
  consultationId: number;
  status: PrescriptionStatus;
  language: PrescriptionLanguage;
  savedAt: string | null;
  finalizedAt: string | null;
  content: IPrescriptionContent;
  patient: IPatientSnapshot;
  doctor: IDoctorSnapshot;
  templateId: number;
  templateType: TemplateType;
  templateConfig: ITemplateConfig;
  hospitalSettings: IHospitalSettingsSnapshot;
}

export interface IPrescriptionListItem {
  prescriptionId: number;
  displayCode: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  status: PrescriptionStatus;
  savedAt: string | null;
  finalizedAt: string | null;
  diagnosisCount: number;
  medicineCount: number;
  investigationCount: number;
}

export interface IPrescriptionListResponse {
  prescriptions: IPrescriptionListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface IDraftPrescriptionListRequest {
  patientId?: number;
  searchTerm?: string;
  date?: string;
  page?: number;
  pageSize?: number;
}

export interface IFinalizedPrescriptionListRequest {
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface IStartOrResumePrescriptionRequest {
  consultationId?: number | null;
  patientId?: number | null;
  prescriptionId?: number | null;
  force?: boolean;
}

export interface IStartOrResumePrescriptionResponse {
  duplicateActiveFound: boolean;
  existingActiveConsultation?: { consultationId: number; displayCode: string; tokenNumber: string; status: string } | null;
  unfinishedDraftFound: boolean;
  unfinishedDrafts: IPrescriptionListItem[];
  document: IPrescriptionDocument | null;
}

export interface ISaveDraftPrescriptionRequest {
  language: PrescriptionLanguage;
  content: IPrescriptionContent;
}
