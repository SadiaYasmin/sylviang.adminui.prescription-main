import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  ICreateStaffRequest,
  ICreateStaffResponse,
  IStaffDetailsResponse,
  IStaffListRequest,
  IStaffListResponse,
  IStaffSummary,
  IUpdateStaffRequest,
} from '@core/interfaces/staff/staff.interface';
import { BASE_URL_Staff } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Staff;

  getStaff(request: IStaffListRequest) {
    const params: Record<string, string> = {};
    if (request.page) params['page'] = String(request.page);
    if (request.pageSize) params['pageSize'] = String(request.pageSize);
    if (request.searchTerm?.trim()) params['searchTerm'] = request.searchTerm.trim();
    if (request.department) params['department'] = request.department;
    if (request.isActive !== undefined) params['isActive'] = String(request.isActive);

    return this.httpClient.get<ApiResponse<IStaffListResponse>>(`${this.API_URL}`, { params });
  }

  getAssignedToMe(searchTerm?: string) {
    const params: Record<string, string> = {};
    if (searchTerm?.trim()) params['searchTerm'] = searchTerm.trim();

    return this.httpClient.get<ApiResponse<IStaffListResponse>>(`${this.API_URL}/assigned-to-me`, { params });
  }

  getStaffById(id: number) {
    return this.httpClient.get<ApiResponse<IStaffDetailsResponse>>(`${this.API_URL}/${id}`);
  }

  addStaff(request: ICreateStaffRequest) {
    return this.httpClient.post<ApiResponse<ICreateStaffResponse>>(`${this.API_URL}`, request);
  }

  updateStaff(id: number, request: IUpdateStaffRequest) {
    return this.httpClient.put<ApiResponse<IStaffSummary>>(`${this.API_URL}/${id}`, request);
  }

  deactivateStaff(id: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }
}
