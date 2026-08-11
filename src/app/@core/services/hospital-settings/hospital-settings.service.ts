import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IHospitalSettings, IUpdateHospitalSettingsRequest } from '@core/interfaces/hospital-settings/hospital-settings.interface';
import { BASE_URL_HospitalSettings } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class HospitalSettingsService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_HospitalSettings;

  get() {
    return this.httpClient.get<ApiResponse<IHospitalSettings>>(`${this.API_URL}`);
  }

  update(request: IUpdateHospitalSettingsRequest) {
    return this.httpClient.put<ApiResponse<IHospitalSettings>>(`${this.API_URL}`, request);
  }
}
