import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { DepartmentListComponent } from './department-list/department-list.component';
import { DepartmentManagementRoutingModule } from './department-management-routing.module';

@NgModule({
  declarations: [DepartmentListComponent],
  imports: [SharedModule, DepartmentManagementRoutingModule],
})
export class DepartmentManagementModule {}
