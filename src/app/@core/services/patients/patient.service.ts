import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { ICreatePatientRequest, IPatientDetailsResponse, IPatientListRequest, IPatientListResponse, IPatientSummary, IUpdatePatientRequest } from '@core/interfaces/patients/patient.interface';
import { BASE_URL_Patients } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Patients;

  getPatients(request: IPatientListRequest) {
    const params: Record<string, string> = {};
    if (request.page) params['page'] = String(request.page);
    if (request.pageSize) params['pageSize'] = String(request.pageSize);
    if (request.searchTerm?.trim()) params['searchTerm'] = request.searchTerm.trim();

    return this.httpClient.get<ApiResponse<IPatientListResponse>>(`${this.API_URL}`, { params });
  }

  getPatientById(id: number) {
    return this.httpClient.get<ApiResponse<IPatientDetailsResponse>>(`${this.API_URL}/${id}`);
  }

  createPatient(request: ICreatePatientRequest) {
    return this.httpClient.post<ApiResponse<IPatientSummary>>(`${this.API_URL}`, request);
  }

  updatePatient(id: number, request: IUpdatePatientRequest) {
    return this.httpClient.put<ApiResponse<IPatientSummary>>(`${this.API_URL}/${id}`, request);
  }
}
