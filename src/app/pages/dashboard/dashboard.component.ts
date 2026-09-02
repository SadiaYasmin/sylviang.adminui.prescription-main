import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IMyDoctorAnalyticsResponse, IMyStaffAnalyticsResponse } from '@core/interfaces/analytics/analytics.interface';
import { IQueueItem } from '@core/interfaces/consultations/consultation.interface';
import { AnalyticsService } from '@core/services/analytics/analytics.service';
import { AuthService } from '@core/services/auth/auth.service';
import { ConsultationService } from '@core/services/consultations/consultation.service';
import { DoctorPreferencesService } from '@core/services/doctor-preferences/doctor-preferences.service';
import { ToastService } from '@core/services/misc/toast.service';
import { DOCTOR_STATS_PERIOD_OPTIONS, DoctorStatsPeriod, resolveDoctorStatsPeriod } from '@app/shared/utils/doctor-stats-period.util';
import { BreadcrumbService } from '@app/@core/services';
import { ANALYTICS_MONO_BUTTON_DT, ANALYTICS_MONO_SELECT_DT } from '@app/shared/utils/analytics-mono-tokens.util';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  currentYear = new Date().getFullYear();
  role: string | null;

  queue: IQueueItem[] = [];
  queueLoading = false;
  needsTemplateChoice = false;
  needsSignatureUpload = false;

  queueDoctorTabs: { doctorId: number; doctorName: string; items: IQueueItem[] }[] = [];
  activeDoctorTabIndex = 0;

  myDoctorStats: IMyDoctorAnalyticsResponse | null = null;
  myStaffStats: IMyStaffAnalyticsResponse | null = null;

  readonly statsPeriodOptions = DOCTOR_STATS_PERIOD_OPTIONS;
  /** Matches the queue action buttons to the Analytics dashboard's monochromatic teal instead of the app's global primary color — see analytics-mono-tokens.util.ts. */
  readonly buttonDt = ANALYTICS_MONO_BUTTON_DT;
  readonly selectDt = ANALYTICS_MONO_SELECT_DT;

  /** "Patients Consulted" card's own independent period selector — separate from "Finalized Prescriptions"'s, each card controls only itself. */
  consultedPeriod: DoctorStatsPeriod = 'ThisMonth';
  consultedCount: number | null = null;
  /** Resolved concrete bounds, exposed to the template for this card's navigation query params. Empty strings for "All Time" — the routerLink then just omits them. */
  consultedRangeFrom = '';
  consultedRangeTo = '';

  /** "Finalized Prescriptions" card's own independent period selector. */
  finalizedPeriod: DoctorStatsPeriod = 'ThisMonth';
  finalizedCount: number | null = null;
  finalizedRangeFrom = '';
  finalizedRangeTo = '';

  constructor(
    private authService: AuthService,
    private consultationService: ConsultationService,
    private doctorPreferencesService: DoctorPreferencesService,
    private analyticsService: AnalyticsService,
    private toast: ToastService,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
  ) {
    this.role = this.authService.getRole();
  }

  get isDoctor(): boolean {
    return this.role === 'Doctor';
  }

  get isStaff(): boolean {
    return this.role === 'Staff';
  }

  get activeDoctorTabItems(): IQueueItem[] {
    return this.queueDoctorTabs[this.activeDoctorTabIndex]?.items ?? [];
  }

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ title: 'Dashboard', icon: 'fa-solid fa-chart-line', href: '/dashboard' }]);

    if (this.isDoctor) {
      this.loadTodaysQueue();
      this.checkTemplateChoice();
      this.loadMyDoctorStats();
      this.loadConsultedCount();
      this.loadFinalizedCount();
    } else if (this.isStaff) {
      this.loadMyQueue();
      this.loadMyStaffStats();
    }
  }

  // US-064: nudges a doctor who has never picked (or whose picked template has since been
  // disabled/deleted) a preferred template — finalize already hard-blocks on this
  // (FinalizePrescriptionHandler's checklist), this is just the proactive dashboard prompt.
  checkTemplateChoice(): void {
    this.doctorPreferencesService.get().subscribe({
      next: (response) => {
        this.needsTemplateChoice = !response.hasError && !response.content?.preferredTemplateId;
        this.needsSignatureUpload = !response.hasError && !response.content?.signatureUrl;
      },
      error: () => {
        // Non-critical — leave the nudges hidden if this call fails.
      },
    });
  }

  loadTodaysQueue(): void {
    this.queueLoading = true;
    this.consultationService.getTodaysQueue().subscribe({
      next: (response) => {
        this.queue = !response.hasError && response.content ? response.content : [];
        this.queueLoading = false;
      },
      error: () => {
        this.queue = [];
        this.queueLoading = false;
      },
    });
  }

  loadMyQueue(): void {
    this.queueLoading = true;
    this.consultationService.getMyQueue().subscribe({
      next: (response) => {
        this.queue = !response.hasError && response.content ? response.content : [];
        this.buildQueueDoctorTabs();
        this.queueLoading = false;
      },
      error: () => {
        this.queue = [];
        this.queueDoctorTabs = [];
        this.queueLoading = false;
      },
    });
  }

  // US-079: staff's "My Queue" split into one tab per assigned doctor so staff can see each
  // doctor's consultation queue separately instead of one mixed table.
  buildQueueDoctorTabs(): void {
    const byDoctor = new Map<number, { doctorId: number; doctorName: string; items: IQueueItem[] }>();
    for (const item of this.queue) {
      const existing = byDoctor.get(item.doctorId);
      if (existing) {
        existing.items.push(item);
      } else {
        byDoctor.set(item.doctorId, { doctorId: item.doctorId, doctorName: item.doctorName, items: [item] });
      }
    }
    this.queueDoctorTabs = Array.from(byDoctor.values()).sort((a, b) => a.doctorName.localeCompare(b.doctorName));
    this.activeDoctorTabIndex = 0;
  }

  // US-077: a doctor's own scoped stats card, alongside Today's Queue. Fetch failures are
  // non-critical (matches checkTemplateChoice's pattern) — the queue table still renders.
  // My Patients/Draft Prescriptions/Assigned Staff/Top Medicines are all-time regardless of
  // either card's period selector, so this call needs no date range of its own.
  loadMyDoctorStats(): void {
    this.analyticsService.getMyDoctorStats().subscribe({
      next: (response) => {
        this.myDoctorStats = !response.hasError && response.content ? response.content : null;
      },
      error: () => {
        this.myDoctorStats = null;
      },
    });
  }

  // "Patients Consulted" card owns its own period, independent of "Finalized Prescriptions".
  loadConsultedCount(): void {
    const { from, to } = resolveDoctorStatsPeriod(this.consultedPeriod);
    this.consultedRangeFrom = from ?? '';
    this.consultedRangeTo = to ?? '';
    this.analyticsService.getMyDoctorStats(from, to).subscribe({
      next: (response) => {
        this.consultedCount = !response.hasError && response.content ? response.content.patientsConsulted : null;
      },
      error: () => {
        this.consultedCount = null;
      },
    });
  }

  onConsultedPeriodChange(period: DoctorStatsPeriod): void {
    this.consultedPeriod = period;
    this.loadConsultedCount();
  }

  // "Finalized Prescriptions" card owns its own period, independent of "Patients Consulted".
  loadFinalizedCount(): void {
    const { from, to } = resolveDoctorStatsPeriod(this.finalizedPeriod);
    this.finalizedRangeFrom = from ?? '';
    this.finalizedRangeTo = to ?? '';
    this.analyticsService.getMyDoctorStats(from, to).subscribe({
      next: (response) => {
        this.finalizedCount = !response.hasError && response.content ? response.content.finalizedPrescriptionCount : null;
      },
      error: () => {
        this.finalizedCount = null;
      },
    });
  }

  onFinalizedPeriodChange(period: DoctorStatsPeriod): void {
    this.finalizedPeriod = period;
    this.loadFinalizedCount();
  }

  // US-078: a staff member's own scoped stats card, alongside My Queue.
  loadMyStaffStats(): void {
    this.analyticsService.getMyStaffStats().subscribe({
      next: (response) => {
        this.myStaffStats = !response.hasError && response.content ? response.content : null;
      },
      error: () => {
        this.myStaffStats = null;
      },
    });
  }

  displayStatus(status: string): string {
    if (status === 'InConsultation') return 'In Progress';
    if (status === 'Draft') return 'Draft';
    return status;
  }

  // Opening a consultation now lands directly in prescription authoring (Epic D) — the
  // Waiting -> InConsultation transition happens there (StartOrResumePrescriptionHandler),
  // not here, so there's no separate "open" call before navigating.
  openConsultation(item: IQueueItem): void {
    this.router.navigate(['/prescriptions'], { queryParams: { consultationId: item.consultationId } });
  }
}
