/**
 * Minimal shape the three template components actually render — deliberately narrower
 * than either `IHospitalSettings` (Epic H's full CRUD shape) or `IHospitalSettingsSnapshot`
 * (Epic D's read-only embed in a prescription document), so both satisfy this structurally
 * without an adapter/mapping step at every call site.
 */
export interface IHospitalBranding {
  name: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  emergencyNumber: string | null;
  website: string | null;
  slogan: string | null;
  sloganBn: string | null;
  licenseNumber: string | null;
}
