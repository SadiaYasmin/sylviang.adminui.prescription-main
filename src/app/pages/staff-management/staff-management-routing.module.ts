import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role.guard';
import { ManageStaffComponent } from './manage-staff/manage-staff.component';
import { StaffListComponent } from './staff-list/staff-list.component';

const routes: Routes = [
  {
    path: 'staff-list',
    component: StaffListComponent,
  },
  {
    path: 'manage-staff',
    component: ManageStaffComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
  },
  {
    path: 'manage-staff/:id',
    component: ManageStaffComponent,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StaffManagementRoutingModule {}
