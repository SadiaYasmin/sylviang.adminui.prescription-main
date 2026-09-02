import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { AllergyPresetOptions } from '@app/@core/constants/allergy-presets';
import { BloodGroupLabels } from '@app/@core/constants/blood-group-options';
import { UI_CONFIG } from '@app/@core/constants';
import { IPatientSummary } from '@core/interfaces/patients/patient.interface';
import { AuthService } from '@core/services/auth/auth.service';
import { PatientService } from '@core/services/patients/patient.service';
import { DOCTOR_STATS_PERIOD_OPTIONS, DoctorStatsPeriod } from '@app/shared/utils/doctor-stats-period.util';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-patient-list',
  standalone: false,
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss',
})
export class PatientListComponent implements OnInit, OnDestroy {
  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
  ) {}

  /** One-shot registration-date range from navigation context (e.g. Executive Summary's "Total Patients" card) — read once on init, applied to every load, never shown as a visible filter control on this page. */
  private navFrom: string | null = null;
  private navTo: string | null = null;
  private navNewOnly = false;
  private navReturningOnly = false;
  /** Public (not private) so the template can show a small "Showing patients consulted: X" context label near the page title — this page still gets no visible date-range filter control, just this label. */
  navCompletedWithMeOnly = false;
  navPeriodLabel = '';

  private readonly destroy$ = new Subject<void>();
  private readonly searchTermChanges$ = new Subject<string>();

  patients: IPatientSummary[] = [];
  loading = false;
  totalRecords = 0;
  UI_CONFIG = UI_CONFIG;
  rows = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  searchTerm = '';

  private readonly role = this.authService.getRole();

  // The backend already scopes which rows come back per role — these only decide
  // which columns/buttons render, not which patients are visible.
  showClinical = this.role !== 'Admin';
  showAdminMeta = this.role === 'Admin';
  showRegisteredDate = this.role !== 'Doctor';
  canRegister = this.role === 'Staff';
  canEdit = this.role === 'Staff' || this.role === 'Doctor';
  canCreateConsultation = this.role === 'Staff';

  showConsultationDialog = false;
  consultationPatient: IPatientSummary | null = null;

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  get columnCount(): number {
    return 2 + (this.showClinical ? 4 : 0) + (this.showRegisteredDate ? 1 : 0) + (this.showAdminMeta ? 1 : 0) + (this.canEdit ? 1 : 0);
  }

  get skeletonColumns(): number[] {
    return Array(this.columnCount).fill(0);
  }

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ title: 'Patient Management', icon: 'fa-solid fa-user-injured', href: '/patients/patient-list' }]);

    const params = this.route.snapshot.queryParamMap;
    this.navFrom = params.get('from');
    this.navTo = params.get('to');
    this.navNewOnly = params.get('newOnly') === 'true';
    this.navReturningOnly = params.get('returningOnly') === 'true';
    this.navCompletedWithMeOnly = params.get('completedWithMeOnly') === 'true';
    if (this.navCompletedWithMeOnly) {
      const requestedPeriod = params.get('period') as DoctorStatsPeriod | null;
      this.navPeriodLabel = DOCTOR_STATS_PERIOD_OPTIONS.find((opt) => opt.value === requestedPeriod)?.label ?? 'This Month';
    }

    this.searchTermChanges$.pipe(debounceTime(UI_CONFIG.searchDebounceTime), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage = 1;
      this.loadPatients();
    });

    this.loadPatients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchTermChange(value: string): void {
    this.searchTerm = value;
    this.searchTermChanges$.next(value);
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;

    this.patientService
      .getPatients({
        page: this.currentPage,
        pageSize: this.rows,
        searchTerm: this.searchTerm || undefined,
        from: this.navFrom || undefined,
        to: this.navTo || undefined,
        newOnly: this.navNewOnly || undefined,
        returningOnly: this.navReturningOnly || undefined,
        completedWithMeOnly: this.navCompletedWithMeOnly || undefined,
      })
      .subscribe({
        next: (response) => {
          if (!response.hasError && response.content) {
            this.patients = response.content.patients || [];
            this.totalRecords = response.content.totalCount || 0;
          } else {
            this.patients = [];
            this.totalRecords = 0;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.patients = [];
          this.totalRecords = 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onPageChange(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadPatients();
  }

  displayAge(patient: IPatientSummary): string {
    if (patient.dateOfBirth) {
      // Parse the "YYYY-MM-DD" wire format directly rather than through `new Date(string)`,
      // which parses date-only ISO strings as UTC midnight and would silently shift the
      // date backward by a day when read via local getters in any negative-UTC-offset
      // timezone (Bangladesh's own +6 offset never triggers it, but a browser/CI machine
      // set to a different zone would give a wrong, off-by-one age right around birthdays).
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(patient.dateOfBirth);
      if (match) {
        const [, y, m, d] = match;
        const birthYear = Number(y);
        const birthMonth = Number(m) - 1;
        const birthDay = Number(d);
        const today = new Date();
        let age = today.getFullYear() - birthYear;
        const hasHadBirthdayThisYear = today.getMonth() > birthMonth || (today.getMonth() === birthMonth && today.getDate() >= birthDay);
        if (!hasHadBirthdayThisYear) age--;
        return age >= 0 ? String(age) : '-';
      }
    }
    return patient.age != null ? String(patient.age) : '-';
  }

  bloodGroupLabel(patient: IPatientSummary): string {
    return (patient.bloodGroup && BloodGroupLabels[patient.bloodGroup]) || '-';
  }

  openConsultationDialog(patient: IPatientSummary): void {
    this.consultationPatient = patient;
    this.showConsultationDialog = true;
  }

  allergyDisplay(patient: IPatientSummary): string {
    if (patient.allergyPresetId && patient.allergyPresetId !== 'None') {
      return AllergyPresetOptions.find((option) => option.value === patient.allergyPresetId)?.label || patient.allergyPresetId;
    }
    if (!patient.allergyPresetId && patient.allergyOtherText) {
      return patient.allergyOtherText;
    }
    return 'None';
  }
}
