import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IDoctorPreferences,
  IDoctorProfile,
  IUpdateDoctorPhotoRequest,
  IUpdateDoctorPreferencesRequest,
  IUpdateDoctorProfileRequest,
  IUpdateDoctorSignatureRequest,
} from '@core/interfaces/doctor-preferences/doctor-preferences.interface';
import { BASE_URL_DoctorPreferences, BASE_URL_DoctorProfile } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class DoctorPreferencesService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_DoctorPreferences;
  PROFILE_URL = BASE_URL_DoctorProfile;

  get() {
    return this.httpClient.get<ApiResponse<IDoctorPreferences>>(`${this.API_URL}`);
  }

  update(request: IUpdateDoctorPreferencesRequest) {
    return this.httpClient.put<ApiResponse<IDoctorPreferences>>(`${this.API_URL}`, request);
  }

  updateSignature(request: IUpdateDoctorSignatureRequest) {
    return this.httpClient.put<ApiResponse<IDoctorPreferences>>(`${this.API_URL}/signature`, request);
  }

  getProfile() {
    return this.httpClient.get<ApiResponse<IDoctorProfile>>(`${this.PROFILE_URL}/profile`);
  }

  updateProfile(request: IUpdateDoctorProfileRequest) {
    return this.httpClient.put<ApiResponse<IDoctorProfile>>(`${this.PROFILE_URL}/profile`, request);
  }

  updatePhoto(request: IUpdateDoctorPhotoRequest) {
    return this.httpClient.put<ApiResponse<IDoctorProfile>>(`${this.PROFILE_URL}/photo`, request);
  }

  removePhoto() {
    return this.httpClient.delete<ApiResponse<IDoctorProfile>>(`${this.PROFILE_URL}/photo`);
  }
}
