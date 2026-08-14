import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IMedicineSummary } from '@core/interfaces/medicines/medicine.interface';
import { BASE_URL_Medicines } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class MedicineService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Medicines;

  search(term: string) {
    const params: Record<string, string> = {};
    if (term?.trim()) params['search'] = term.trim();
    return this.httpClient.get<ApiResponse<IMedicineSummary[]>>(`${this.API_URL}`, { params });
  }
}
