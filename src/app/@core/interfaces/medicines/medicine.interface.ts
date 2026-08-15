export interface IMedicineSummary {
  medicineId: number;
  brandName: string;
  genericName: string | null;
  strength: string | null;
  dosageForm: string | null;
  category: string | null;
}

/** Epic F (US-037/038/039): the Medicine Catalog management screen's row shape — Admin/Doctor only. */
export interface IMedicineCatalogEntry {
  medicineId: number;
  brandName: string;
  genericName: string | null;
  strength: string | null;
  manufacturer: string | null;
  dosageForm: string | null;
  category: string | null;
  active: boolean;
  totalPrescribed: number;
}

export interface ICreateMedicineRequest {
  brandName: string;
  genericName: string | null;
  strength: string | null;
  manufacturer: string | null;
  dosageForm: string | null;
  category: string | null;
}

export type IUpdateMedicineRequest = ICreateMedicineRequest;
