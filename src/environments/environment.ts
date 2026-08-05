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
export const BASE_URL_Auth = `${BASE_URL_Backend}/auth`;
export const BASE_URL_Doctors = `${BASE_URL_Backend}/doctors`;
export const BASE_URL_Staff = `${BASE_URL_Backend}/staff`;
