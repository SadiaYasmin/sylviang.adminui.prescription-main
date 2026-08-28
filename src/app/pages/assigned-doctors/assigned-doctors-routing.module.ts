import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssignedDoctorDetailsComponent } from './assigned-doctor-details/assigned-doctor-details.component';
import { AssignedDoctorListComponent } from './assigned-doctor-list/assigned-doctor-list.component';

const routes: Routes = [
  { path: '', component: AssignedDoctorListComponent },
  { path: ':id', component: AssignedDoctorDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssignedDoctorsRoutingModule {}
