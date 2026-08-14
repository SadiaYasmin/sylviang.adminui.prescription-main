import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IDoctorPreferences,
  IUpdateDoctorPreferencesRequest,
  IUpdateDoctorSignatureRequest,
} from '@core/interfaces/doctor-preferences/doctor-preferences.interface';
import { BASE_URL_DoctorPreferences } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class DoctorPreferencesService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_DoctorPreferences;

  get() {
    return this.httpClient.get<ApiResponse<IDoctorPreferences>>(`${this.API_URL}`);
  }

  update(request: IUpdateDoctorPreferencesRequest) {
    return this.httpClient.put<ApiResponse<IDoctorPreferences>>(`${this.API_URL}`, request);
  }

  updateSignature(request: IUpdateDoctorSignatureRequest) {
    return this.httpClient.put<ApiResponse<IDoctorPreferences>>(`${this.API_URL}/signature`, request);
  }
}
