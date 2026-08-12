import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsultationListComponent } from './consultation-list/consultation-list.component';

const routes: Routes = [
  {
    path: 'consultation-list',
    component: ConsultationListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsultationManagementRoutingModule {}
