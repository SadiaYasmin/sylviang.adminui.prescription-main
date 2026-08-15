import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManageMedicineComponent } from './manage-medicine/manage-medicine.component';
import { MedicineListComponent } from './medicine-list/medicine-list.component';

const routes: Routes = [
  { path: 'medicine-list', component: MedicineListComponent },
  { path: 'manage-medicine', component: ManageMedicineComponent },
  { path: 'manage-medicine/:id', component: ManageMedicineComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MedicineManagementRoutingModule {}
