import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { ICreateMedicineRequest, IMedicineCatalogEntry, IMedicineSummary, IUpdateMedicineRequest } from '@core/interfaces/medicines/medicine.interface';
import { BASE_URL_Medicines } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class MedicineService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Medicines;

  /** Cheap, role-agnostic — used by prescription authoring's medicine autocomplete (hot path). */
  search(term: string) {
    const params: Record<string, string> = {};
    if (term?.trim()) params['search'] = term.trim();
    return this.httpClient.get<ApiResponse<IMedicineSummary[]>>(`${this.API_URL}`, { params });
  }

  /** Admin/Doctor only — the Medicine Catalog management screen, includes Total Prescribed. */
  getCatalog(term?: string) {
    const params: Record<string, string> = {};
    if (term?.trim()) params['search'] = term.trim();
    return this.httpClient.get<ApiResponse<IMedicineCatalogEntry[]>>(`${this.API_URL}/catalog`, { params });
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
}
