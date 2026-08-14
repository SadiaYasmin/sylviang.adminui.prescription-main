import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role.guard';
import { Shell } from '@app/shell/services/shell.service';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  Shell.childRoutes([
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'home', redirectTo: '/dashboard', pathMatch: 'full' },
    {
      path: 'dashboard',
      component: DashboardComponent,
    },
    {
      path: 'attendance',
      loadChildren: () => import('./attendance-management/attendance-management.module').then((m) => m.AttendanceManagementModule),
    },
    {
      path: 'payroll',
      loadChildren: () => import('./payroll-management/payroll-management.module').then((m) => m.PayrollManagementModule),
    },
    {
      path: 'doctors',
      canActivate: [roleGuard],
      data: { roles: ['Admin'] },
      loadChildren: () => import('./doctor-management/doctor-management.module').then((m) => m.DoctorManagementModule),
    },
    {
      path: 'staff',
      canActivate: [roleGuard],
      data: { roles: ['Admin', 'Doctor'] },
      loadChildren: () => import('./staff-management/staff-management.module').then((m) => m.StaffManagementModule),
    },
    {
      path: 'patients',
      canActivate: [roleGuard],
      data: { roles: ['Admin', 'Doctor', 'Staff'] },
      loadChildren: () => import('./patient-management/patient-management.module').then((m) => m.PatientManagementModule),
    },
    {
      path: 'templates',
      canActivate: [roleGuard],
      data: { roles: ['Admin'] },
      loadChildren: () => import('./template-management/template-management.module').then((m) => m.TemplateManagementModule),
    },
    {
      path: 'consultations',
      canActivate: [roleGuard],
      data: { roles: ['Admin'] },
      loadChildren: () => import('./consultation-management/consultation-management.module').then((m) => m.ConsultationManagementModule),
    },
    {
      path: 'prescriptions',
      canActivate: [roleGuard],
      data: { roles: ['Admin', 'Doctor', 'Staff'] },
      loadChildren: () => import('./prescription-management/prescription-management.module').then((m) => m.PrescriptionManagementModule),
    },
  ]),
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
