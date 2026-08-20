import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IDepartment, IDepartmentCreateRequest, IDepartmentUpdateRequest } from '@core/interfaces/departments/department.interface';
import { BASE_URL_Departments } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  constructor(private httpClient: HttpClient) {}
  API_URL = BASE_URL_Departments;

  getAll(): Observable<ApiResponse<IDepartment[]>> {
    return this.httpClient.get<ApiResponse<IDepartment[]>>(`${this.API_URL}`);
  }

  create(request: IDepartmentCreateRequest): Observable<ApiResponse<number>> {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  update(id: number, request: IDepartmentUpdateRequest): Observable<ApiResponse<void>> {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${id}`, request);
  }

  deactivate(id: number): Observable<ApiResponse<void>> {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }
}
