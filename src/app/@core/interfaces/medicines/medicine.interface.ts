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
  route: string | null;
  category: string | null;
  unitPrice: number | null;
  dgdaRegistered: boolean;
  active: boolean;
  totalPrescribed: number;
}

export interface ICreateMedicineRequest {
  brandName: string;
  genericName: string | null;
  strength: string | null;
  manufacturer: string | null;
  dosageForm: string | null;
  route: string | null;
  category: string | null;
  unitPrice: number | null;
  dgdaRegistered: boolean;
}

export type IUpdateMedicineRequest = ICreateMedicineRequest;

/** Paged wrapper for the plain search/browse (Admin, Doctor, and Staff all get the same rows/count — no analytics fields). */
export interface IMedicineSearchListResponse {
  medicines: IMedicineSummary[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/** Paged wrapper for the Medicine Catalog admin/doctor screen (large catalogs need server-side paging). */
export interface IMedicineCatalogListResponse {
  medicines: IMedicineCatalogEntry[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

/** Result summary of an admin CSV catalog import (medicine-feature-brief.md §5). */
export interface IMedicineImportResult {
  rowsRead: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}
