import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { ChartModule } from 'primeng/chart';
import { TabsModule } from 'primeng/tabs';
import { AnalyticsDashboardComponent } from './analytics-dashboard/analytics-dashboard.component';
import { AnalyticsRoutingModule } from './analytics-routing.module';
import { DoctorActivityTabComponent } from './doctor-activity-tab/doctor-activity-tab.component';
import { ExecutiveSummaryTabComponent } from './executive-summary-tab/executive-summary-tab.component';
import { MedicinePrescriptionTabComponent } from './medicine-prescription-tab/medicine-prescription-tab.component';
import { PatientAnalyticsTabComponent } from './patient-analytics-tab/patient-analytics-tab.component';
import { PrescriptionTrendsTabComponent } from './prescription-trends-tab/prescription-trends-tab.component';

@NgModule({
  declarations: [
    AnalyticsDashboardComponent,
    ExecutiveSummaryTabComponent,
    MedicinePrescriptionTabComponent,
    DoctorActivityTabComponent,
    PrescriptionTrendsTabComponent,
    PatientAnalyticsTabComponent,
  ],
  imports: [SharedModule, RouterModule, AnalyticsRoutingModule, TabsModule, ChartModule],
})
export class AnalyticsModule {}
