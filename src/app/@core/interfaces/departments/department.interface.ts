export interface IDepartment {
  departmentId: number;
  name: string;
  isActive: boolean;
}

export interface IDepartmentCreateRequest {
  name: string;
}

export interface IDepartmentUpdateRequest {
  name: string;
  isActive: boolean;
}
