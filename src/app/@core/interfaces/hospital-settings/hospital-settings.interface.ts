export interface IHospitalSettings {
  hospitalSettingsId: number;
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

export type IUpdateHospitalSettingsRequest = Omit<IHospitalSettings, 'hospitalSettingsId'>;
