export interface IAssignedDoctorSummary {
  doctorId: number;
  fullName: string;
}

export interface IStaffProfileFields {
  fullName: string;
  phone: string;
  department?: string | null;
}

export interface ICreateStaffRequest extends IStaffProfileFields {
  username: string;
  email?: string | null;
  assignedDoctorIds: number[];
}

export interface ICreateStaffResponse {
  staffId: number;
  userId: number;
  username: string;
  temporaryPassword: string;
}

export interface IUpdateStaffRequest extends IStaffProfileFields {
  email?: string | null;
  assignedDoctorIds: number[];
  isActive: boolean;
}

export interface IStaffSummary extends IStaffProfileFields {
  staffId: number;
  userId: number;
  username: string;
  email?: string | null;
  isActive: boolean;
  assignedDoctors: IAssignedDoctorSummary[];
}

export interface IStaffListRequest {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  department?: string;
  isActive?: boolean;
}

export interface IStaffListResponse {
  staff: IStaffSummary[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface IStaffDetailsResponse {
  profile: IStaffSummary;
}
