import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role.guard';
import { ManagePatientComponent } from './manage-patient/manage-patient.component';
import { PatientListComponent } from './patient-list/patient-list.component';

const routes: Routes = [
  {
    path: 'patient-list',
    component: PatientListComponent,
  },
  {
    path: 'manage-patient',
    component: ManagePatientComponent,
    canActivate: [roleGuard],
    data: { roles: ['Staff', 'Doctor'] },
  },
  {
    path: 'manage-patient/:id',
    component: ManagePatientComponent,
    canActivate: [roleGuard],
    data: { roles: ['Staff', 'Doctor'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PatientManagementRoutingModule {}
