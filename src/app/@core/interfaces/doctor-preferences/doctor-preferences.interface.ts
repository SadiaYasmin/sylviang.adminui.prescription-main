import { PrescriptionLanguage } from '@core/interfaces/prescriptions/prescription.interface';

export interface IDoctorPreferences {
  preferredTemplateId: number | null;
  signatureBase64: string | null;
  preferredLanguage: PrescriptionLanguage | null;
}

export interface IUpdateDoctorPreferencesRequest {
  preferredTemplateId: number | null;
  preferredLanguage: PrescriptionLanguage | null;
}

export interface IUpdateDoctorSignatureRequest {
  signatureBase64: string;
}
