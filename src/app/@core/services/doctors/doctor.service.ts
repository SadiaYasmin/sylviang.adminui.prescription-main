import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  ICreateDoctorRequest,
  ICreateDoctorResponse,
  IDoctorDetailsResponse,
  IDoctorListRequest,
  IDoctorListResponse,
  IDoctorSummary,
  IUpdateDoctorRequest,
} from '@core/interfaces/doctors/doctor.interface';
import { BASE_URL_Doctors } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Doctors;

  getDoctors(request: IDoctorListRequest) {
    const params: Record<string, string> = {};
    if (request.page) params['page'] = String(request.page);
    if (request.pageSize) params['pageSize'] = String(request.pageSize);
    if (request.searchTerm?.trim()) params['searchTerm'] = request.searchTerm.trim();
    if (request.department) params['department'] = request.department;
    if (request.isActive !== undefined) params['isActive'] = String(request.isActive);

    return this.httpClient.get<ApiResponse<IDoctorListResponse>>(`${this.API_URL}`, { params });
  }

  getDoctorById(id: number) {
    return this.httpClient.get<ApiResponse<IDoctorDetailsResponse>>(`${this.API_URL}/${id}`);
  }

  addDoctor(request: ICreateDoctorRequest) {
    return this.httpClient.post<ApiResponse<ICreateDoctorResponse>>(`${this.API_URL}`, request);
  }

  updateDoctor(id: number, request: IUpdateDoctorRequest) {
    return this.httpClient.put<ApiResponse<IDoctorSummary>>(`${this.API_URL}/${id}`, request);
  }

  deactivateDoctor(id: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }
}
