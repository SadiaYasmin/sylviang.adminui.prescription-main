import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IAssignedDoctorDetails, IAssignedDoctorListItem } from '@core/interfaces/doctors/doctor.interface';
import { BASE_URL_AssignedDoctors } from '@env/environment';

/** A staff member's own read-only "assigned to me" view of doctors. */
@Injectable({
  providedIn: 'root',
})
export class AssignedDoctorsService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_AssignedDoctors;

  getList() {
    return this.httpClient.get<ApiResponse<{ doctors: IAssignedDoctorListItem[] }>>(`${this.API_URL}`);
  }

  getDetails(doctorId: number) {
    return this.httpClient.get<ApiResponse<IAssignedDoctorDetails>>(`${this.API_URL}/${doctorId}`);
  }
}
