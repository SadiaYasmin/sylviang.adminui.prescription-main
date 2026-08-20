import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IDraftPrescriptionListRequest,
  IFinalizedPrescriptionListRequest,
  IPrescriptionDocument,
  IPrescriptionListResponse,
  ISaveDraftPrescriptionRequest,
  IStartOrResumePrescriptionRequest,
  IStartOrResumePrescriptionResponse,
} from '@core/interfaces/prescriptions/prescription.interface';
import { BASE_URL_Prescriptions } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class PrescriptionService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Prescriptions;

  start(request: IStartOrResumePrescriptionRequest) {
    return this.httpClient.post<ApiResponse<IStartOrResumePrescriptionResponse>>(`${this.API_URL}/start`, request);
  }

  saveDraft(id: number, request: ISaveDraftPrescriptionRequest) {
    return this.httpClient.put<ApiResponse<IPrescriptionDocument>>(`${this.API_URL}/${id}`, request);
  }

  /**
   * Background auto-save for data protection while authoring. Persists the current content
   * but leaves the prescription InProgress (never promotes it to Draft), so it stays out of
   * the Draft Prescriptions list until the doctor leaves or explicitly saves it.
   */
  autoSave(id: number, request: ISaveDraftPrescriptionRequest) {
    return this.httpClient.patch<ApiResponse<{ prescriptionId: number; status: string; autoSavedAt: string }>>(
      `${this.API_URL}/${id}/autosave`,
      request,
    );
  }

  finalize(id: number, request: ISaveDraftPrescriptionRequest) {
    return this.httpClient.post<ApiResponse<IPrescriptionDocument>>(`${this.API_URL}/${id}/finalize`, request);
  }

  getDrafts(request: IDraftPrescriptionListRequest = {}) {
    const params: Record<string, string> = {};
    if (request.patientId) params['patientId'] = String(request.patientId);
    if (request.searchTerm?.trim()) params['searchTerm'] = request.searchTerm.trim();
    if (request.date) params['date'] = request.date;
    if (request.page) params['page'] = String(request.page);
    if (request.pageSize) params['pageSize'] = String(request.pageSize);
    return this.httpClient.get<ApiResponse<IPrescriptionListResponse>>(`${this.API_URL}/drafts`, { params });
  }

  getFinalized(request: IFinalizedPrescriptionListRequest = {}) {
    const params: Record<string, string> = {};
    if (request.searchTerm?.trim()) params['searchTerm'] = request.searchTerm.trim();
    if (request.fromDate) params['fromDate'] = request.fromDate;
    if (request.toDate) params['toDate'] = request.toDate;
    if (request.page) params['page'] = String(request.page);
    if (request.pageSize) params['pageSize'] = String(request.pageSize);
    return this.httpClient.get<ApiResponse<IPrescriptionListResponse>>(`${this.API_URL}/finalized`, { params });
  }

  getPatientHistory(patientId: number) {
    return this.httpClient.get<ApiResponse<IPrescriptionListResponse>>(`${this.API_URL}/patient/${patientId}/history`);
  }

  getById(id: number) {
    return this.httpClient.get<ApiResponse<IPrescriptionDocument>>(`${this.API_URL}/${id}`);
  }

  verify(displayCode: string) {
    return this.httpClient.get<ApiResponse<IPrescriptionDocument>>(`${this.API_URL}/verify/${displayCode}`);
  }
}
