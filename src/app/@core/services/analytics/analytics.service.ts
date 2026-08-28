import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  AnalyticsGranularity,
  IBusiestConsultationHoursResponse,
  IDoctorLeaderboardEntry,
  IExecutiveSummaryResponse,
  IMedicineAnalyticsResponse,
  IMyDoctorAnalyticsResponse,
  IMyStaffAnalyticsResponse,
  IPatientAnalyticsResponse,
  IPrescriptionVolumeTrendResponse,
} from '@core/interfaces/analytics/analytics.interface';
import { BASE_URL_Analytics } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Analytics;

  getMedicineAnalytics() {
    return this.httpClient.get<ApiResponse<IMedicineAnalyticsResponse>>(`${this.API_URL}/medicines`);
  }

  getDoctorLeaderboard() {
    return this.httpClient.get<ApiResponse<IDoctorLeaderboardEntry[]>>(`${this.API_URL}/doctors/leaderboard`);
  }

  getBusiestConsultationHours() {
    return this.httpClient.get<ApiResponse<IBusiestConsultationHoursResponse>>(`${this.API_URL}/doctors/busiest-hours`);
  }

  getPrescriptionTrend(granularity: AnalyticsGranularity, from?: string, to?: string) {
    const params: Record<string, string> = { granularity };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.httpClient.get<ApiResponse<IPrescriptionVolumeTrendResponse>>(`${this.API_URL}/prescription-trend`, { params });
  }

  getPatientAnalytics(granularity: AnalyticsGranularity = 'Day') {
    return this.httpClient.get<ApiResponse<IPatientAnalyticsResponse>>(`${this.API_URL}/patients`, {
      params: { granularity },
    });
  }

  getExecutiveSummary() {
    return this.httpClient.get<ApiResponse<IExecutiveSummaryResponse>>(`${this.API_URL}/executive-summary`);
  }

  getMyDoctorStats() {
    return this.httpClient.get<ApiResponse<IMyDoctorAnalyticsResponse>>(`${this.API_URL}/my/doctor-stats`);
  }

  getMyStaffStats() {
    return this.httpClient.get<ApiResponse<IMyStaffAnalyticsResponse>>(`${this.API_URL}/my/staff-stats`);
  }
}
