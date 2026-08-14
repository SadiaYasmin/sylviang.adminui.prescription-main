import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IAddQuickAddPresetRequest, IQuickAddPreset, QuickAddSectionType } from '@core/interfaces/quick-add/quick-add.interface';
import { BASE_URL_QuickAdd } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class QuickAddService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_QuickAdd;

  getList(sectionType: QuickAddSectionType) {
    return this.httpClient.get<ApiResponse<IQuickAddPreset[]>>(`${this.API_URL}`, { params: { sectionType } });
  }

  add(request: IAddQuickAddPresetRequest) {
    return this.httpClient.post<ApiResponse<IQuickAddPreset>>(`${this.API_URL}`, request);
  }

  delete(id: number) {
    return this.httpClient.delete<ApiResponse<null>>(`${this.API_URL}/${id}`);
  }
}
