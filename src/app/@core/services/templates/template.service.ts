import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  ICreateTemplateRequest,
  ITemplateDetails,
  ITemplateListResponse,
  ITemplateSummary,
  IUpdateTemplateRequest,
} from '@core/interfaces/templates/template.interface';
import { BASE_URL_Templates } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Templates;

  getList() {
    return this.httpClient.get<ApiResponse<ITemplateListResponse>>(`${this.API_URL}`);
  }

  getById(id: number) {
    return this.httpClient.get<ApiResponse<ITemplateDetails>>(`${this.API_URL}/${id}`);
  }

  create(request: ICreateTemplateRequest) {
    return this.httpClient.post<ApiResponse<ITemplateDetails>>(`${this.API_URL}`, request);
  }

  update(id: number, request: IUpdateTemplateRequest) {
    return this.httpClient.put<ApiResponse<ITemplateDetails>>(`${this.API_URL}/${id}`, request);
  }

  duplicate(id: number) {
    return this.httpClient.post<ApiResponse<ITemplateDetails>>(`${this.API_URL}/${id}/duplicate`, {});
  }

  toggleEnabled(id: number) {
    return this.httpClient.patch<ApiResponse<ITemplateSummary>>(`${this.API_URL}/${id}/toggle-enabled`, {});
  }

  delete(id: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }
}
