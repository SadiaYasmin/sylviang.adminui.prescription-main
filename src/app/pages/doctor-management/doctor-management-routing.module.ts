import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DoctorDetailsComponent } from './doctor-details/doctor-details.component';
import { DoctorListComponent } from './doctor-list/doctor-list.component';
import { ManageDoctorComponent } from './manage-doctor/manage-doctor.component';

const routes: Routes = [
  {
    path: 'doctor-list',
    component: DoctorListComponent,
  },
  {
    path: 'manage-doctor',
    component: ManageDoctorComponent,
  },
  {
    path: 'manage-doctor/:id',
    component: ManageDoctorComponent,
  },
  {
    path: 'doctor-details/:id',
    component: DoctorDetailsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DoctorManagementRoutingModule {}
