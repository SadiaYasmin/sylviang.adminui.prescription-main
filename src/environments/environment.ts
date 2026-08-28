export const Base_URL = 'http://localhost:5112';
export const production = false;
export const version = '-dev';
export const defaultLanguage = 'en-US';
export const supportedLanguages = ['en-US', 'bn-BD'];
export const fallbackEnabled = true;

export const BASE_URL_Attendance = `${Base_URL}/attendance`;
export const BASE_URL_Payroll = `${Base_URL}/payroll`;

// Real PrescriptionMS backend (SylviaNG.Prescription), distinct from the legacy
// Base_URL above which points at an unrelated placeholder service on port 5112.
export const BASE_URL_Backend = 'http://localhost:5208/prescription';

// US-083: the backend's static-file host, serving wwwroot/uploads/* at the app root —
// NOT under /prescription like the API. Uploaded-image relative URLs (e.g. "/uploads/
// doctor-photos/xyz.png") are resolved against this, not BASE_URL_Backend.
export const BASE_URL_Host = 'http://localhost:5208';
export const BASE_URL_Auth = `${BASE_URL_Backend}/auth`;
export const BASE_URL_Doctors = `${BASE_URL_Backend}/doctors`;
export const BASE_URL_Staff = `${BASE_URL_Backend}/staff`;
export const BASE_URL_Patients = `${BASE_URL_Backend}/patients`;
export const BASE_URL_Consultations = `${BASE_URL_Backend}/consultations`;
export const BASE_URL_Templates = `${BASE_URL_Backend}/templates`;
export const BASE_URL_HospitalSettings = `${BASE_URL_Backend}/hospital-settings`;
export const BASE_URL_Prescriptions = `${BASE_URL_Backend}/prescriptions`;
export const BASE_URL_Medicines = `${BASE_URL_Backend}/medicines`;
export const BASE_URL_QuickAdd = `${BASE_URL_Backend}/quick-add`;
export const BASE_URL_DoctorPreferences = `${BASE_URL_Backend}/doctors/me/preferences`;
export const BASE_URL_DoctorProfile = `${BASE_URL_Backend}/doctors/me`;
export const BASE_URL_Analytics = `${BASE_URL_Backend}/analytics`;
export const BASE_URL_Departments = `${BASE_URL_Backend}/departments`;
export const BASE_URL_AssignedDoctors = `${BASE_URL_Backend}/assigned-doctors`;
export const BASE_URL_Me = `${BASE_URL_Backend}/auth/me`;
