import { PrescriptionLanguage } from '@core/interfaces/prescriptions/prescription.interface';

export interface IDoctorPreferences {
  preferredTemplateId: number | null;
  signatureUrl: string | null;
  preferredLanguage: PrescriptionLanguage | null;
}

export interface IUpdateDoctorPreferencesRequest {
  preferredTemplateId: number | null;
  preferredLanguage: PrescriptionLanguage | null;
}

export interface IUpdateDoctorSignatureRequest {
  signatureBase64: string;
}

/** Epic K (US-061/062): a doctor's own self-editable profile. */
export interface IDoctorProfile {
  doctorId: number;
  fullName: string;
  qualification: string | null;
  department: string | null;
  licenseNumber: string | null;
  phone: string;
  email: string | null;
  photoUrl: string | null;
}

export interface IUpdateDoctorProfileRequest {
  fullName: string;
  qualification: string | null;
  department: string | null;
  licenseNumber: string | null;
  phone: string;
  email: string | null;
}

export interface IUpdateDoctorPhotoRequest {
  photoBase64: string | null;
}
