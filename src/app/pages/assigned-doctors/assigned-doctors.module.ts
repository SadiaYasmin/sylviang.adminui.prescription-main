import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { AssignedDoctorDetailsComponent } from './assigned-doctor-details/assigned-doctor-details.component';
import { AssignedDoctorListComponent } from './assigned-doctor-list/assigned-doctor-list.component';
import { AssignedDoctorsRoutingModule } from './assigned-doctors-routing.module';

@NgModule({
  declarations: [AssignedDoctorListComponent, AssignedDoctorDetailsComponent],
  imports: [CommonModule, RouterModule, SharedModule, AssignedDoctorsRoutingModule, TableModule, ButtonModule, SkeletonModule],
})
export class AssignedDoctorsModule {}
