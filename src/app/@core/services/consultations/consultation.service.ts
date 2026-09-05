import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IAssignedDoctorSummary,
  IConsultationDetailsResponse,
  IConsultationListRequest,
  IConsultationListResponse,
  ICreateConsultationRequest,
  ICreateConsultationResponse,
  IOpenConsultationResponse,
  IQueueItem,
  ISuggestDoctorRequest,
  ISuggestDoctorResponse,
} from '@core/interfaces/consultations/consultation.interface';
import { BASE_URL_Consultations } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class ConsultationService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Consultations;

  createConsultation(request: ICreateConsultationRequest) {
    return this.httpClient.post<ApiResponse<ICreateConsultationResponse>>(`${this.API_URL}`, request);
  }

  openConsultation(id: number) {
    return this.httpClient.post<ApiResponse<IOpenConsultationResponse>>(`${this.API_URL}/${id}/open`, {});
  }

  getTodaysQueue() {
    return this.httpClient.get<ApiResponse<IQueueItem[]>>(`${this.API_URL}/today-queue`);
  }

  getMyQueue() {
    return this.httpClient.get<ApiResponse<IQueueItem[]>>(`${this.API_URL}/my-queue`);
  }

  getMyAssignedDoctors() {
    return this.httpClient.get<ApiResponse<IAssignedDoctorSummary[]>>(`${this.API_URL}/my-assigned-doctors`);
  }

  suggestDoctor(request: ISuggestDoctorRequest) {
    return this.httpClient.post<ApiResponse<ISuggestDoctorResponse>>(`${this.API_URL}/suggest-doctor`, request);
  }

  getConsultations(request: IConsultationListRequest) {
    const params: Record<string, string> = {};
    if (request.page) params['page'] = String(request.page);
    if (request.pageSize) params['pageSize'] = String(request.pageSize);
    if (request.searchTerm?.trim()) params['searchTerm'] = request.searchTerm.trim();
    if (request.dateMode) params['dateMode'] = request.dateMode;
    if (request.date) params['date'] = request.date;
    if (request.fromDate) params['fromDate'] = request.fromDate;
    if (request.toDate) params['toDate'] = request.toDate;
    if (request.doctorId) params['doctorId'] = String(request.doctorId);
    if (request.status) params['status'] = request.status;

    return this.httpClient.get<ApiResponse<IConsultationListResponse>>(`${this.API_URL}`, { params });
  }

  getConsultationById(id: number) {
    return this.httpClient.get<ApiResponse<IConsultationDetailsResponse>>(`${this.API_URL}/${id}`);
  }
}
