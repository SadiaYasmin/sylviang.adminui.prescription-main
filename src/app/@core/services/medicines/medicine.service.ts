import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  ICreateMedicineRequest,
  IMedicineCatalogEntry,
  IMedicineCatalogListResponse,
  IMedicineImportResult,
  IMedicineSearchListResponse,
  IMedicineSummary,
  IUpdateMedicineRequest,
} from '@core/interfaces/medicines/medicine.interface';
import { BASE_URL_Medicines } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class MedicineService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Medicines;

  /** Cheap, role-agnostic — used by prescription authoring's medicine autocomplete (hot path)
   * and Staff's plain catalog browse. Real pagination + total count, same underlying catalog
   * Admin/Doctor's `getCatalog()` reads from — every role can reach every medicine. */
  search(term: string, page: number = 1, pageSize: number = 10) {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    if (term?.trim()) params['search'] = term.trim();
    return this.httpClient.get<ApiResponse<IMedicineSearchListResponse>>(`${this.API_URL}`, { params });
  }

  /** Admin/Doctor only — the Medicine Catalog management screen, includes Total Prescribed. Server-paginated (catalogs can run 20k+ rows after a CSV import). `from`/`to`/`doctorId` are optional: Admin's plain sidebar visit omits them and gets the lifetime hospital-wide count unchanged; a Doctor's own filtered view or an Admin doctor-drill-down passes them. */
  getCatalog(term: string | undefined, page: number, pageSize: number, from?: string, to?: string, doctorId?: number, isActive?: boolean) {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    if (term?.trim()) params['search'] = term.trim();
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (doctorId) params['doctorId'] = String(doctorId);
    if (isActive !== undefined) params['isActive'] = String(isActive);
    return this.httpClient.get<ApiResponse<IMedicineCatalogListResponse>>(`${this.API_URL}/catalog`, { params });
  }

  getById(medicineId: number) {
    return this.httpClient.get<ApiResponse<IMedicineCatalogEntry>>(`${this.API_URL}/${medicineId}`);
  }

  create(request: ICreateMedicineRequest) {
    return this.httpClient.post<ApiResponse<IMedicineCatalogEntry>>(`${this.API_URL}`, request);
  }

  update(medicineId: number, request: IUpdateMedicineRequest) {
    return this.httpClient.put<ApiResponse<IMedicineCatalogEntry>>(`${this.API_URL}/${medicineId}`, request);
  }

  deactivate(medicineId: number) {
    return this.httpClient.post<ApiResponse<null>>(`${this.API_URL}/${medicineId}/deactivate`, {});
  }

  /** Admin-only idempotent CSV upsert (medicine-feature-brief.md §5). */
  importCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post<ApiResponse<IMedicineImportResult>>(`${this.API_URL}/import`, formData);
  }
}
