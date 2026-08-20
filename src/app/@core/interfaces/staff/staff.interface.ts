export interface IAssignedDoctorSummary {
  doctorId: number;
  fullName: string;
  department?: string | null;
}

export interface IStaffProfileFields {
  fullName: string;
  phone: string;
}

export interface ICreateStaffRequest extends IStaffProfileFields {
  username: string;
  email: string;
  assignedDoctorIds: number[];
}

export interface ICreateStaffResponse {
  staffId: number;
  userId: number;
  username: string;
}

export interface IUpdateStaffRequest extends IStaffProfileFields {
  email?: string | null;
  assignedDoctorIds: number[];
  isActive: boolean;
}

/** `departments` is derived server-side (deduped, from the assigned doctors' department) — not a settable field. */
export interface IStaffSummary extends IStaffProfileFields {
  staffId: number;
  userId: number;
  username: string;
  email?: string | null;
  isActive: boolean;
  assignedDoctors: IAssignedDoctorSummary[];
  departments: string[];
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
