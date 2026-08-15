export interface IHospitalSettings {
  hospitalSettingsId: number;
  name: string;
  logoUrl: string | null;
  address: string;
  phone: string;
  emergencyNumber: string;
  email: string;
  website: string;
  slogan: string;
  sloganBn: string;
  licenseNumber: string;
  sealUrl: string | null;
}

/**
 * US-083: request/response are no longer structurally identical — the response returns
 * stored image URLs, but the update request must still carry new images as base64 (or
 * null to leave unchanged / '' to remove, see UpdateHospitalSettingsHandler).
 */
export interface IUpdateHospitalSettingsRequest {
  name: string;
  logoBase64: string | null;
  address: string;
  phone: string;
  emergencyNumber: string;
  email: string;
  website: string;
  slogan: string;
  sloganBn: string;
  licenseNumber: string;
  sealBase64: string | null;
}
