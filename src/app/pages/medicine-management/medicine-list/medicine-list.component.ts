import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { UI_CONFIG } from '@app/@core/constants';
import { DateTimeUtility } from '@app/@core/utils/date-time.utility';
import { PrescriptionTrendRangePreset } from '@core/interfaces/analytics/analytics.interface';
import { IMedicineCatalogEntry } from '@core/interfaces/medicines/medicine.interface';
import { AuthService } from '@core/services/auth/auth.service';
import { MedicineService } from '@core/services/medicines/medicine.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';
import { resolvePrescriptionTrendRange } from '@app/shared/utils/prescription-trend-range.util';
import { MedicineListColumns } from './medicine-list.component.constants';

const RANGE_PRESETS: PrescriptionTrendRangePreset[] = ['Last7Days', 'Last30Days', 'Last3Months', 'Custom'];

/** Parses a "yyyy-MM-dd" query param into a local Date — a plain `new Date(str)` parses as UTC midnight, which can land on the wrong calendar day once displayed in a datepicker. */
function parseDateParam(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * US-036/037/038/039/040. Admin, Doctor, and Staff all see the same catalog view — same rows,
 * same `getCatalog()` endpoint, same pagination — except Staff doesn't see the
 * Total Prescribed/Prescribed column (prescribing volume isn't relevant to a Staff user's job).
 * Only write access (Add/Import/Edit/Deactivate) stays Admin-only.
 *
 * A visible date-range filter (default Last 30 Days) appears whenever the "Prescribed" count
 * is period-based rather than lifetime: always for Doctor (their own prescriptions), or for
 * Admin arriving with Analytics navigation context (an Executive Summary/Medicine & Prescription
 * KPI card, or the Doctor Details "Total Medicines Prescribed" card — the latter also carries a
 * `doctorId` override). Admin's plain sidebar visit shows no filter and the lifetime,
 * hospital-wide "Total Prescribed" column, exactly as before this feature existed. The active
 * filter is mirrored into the URL (`preset`, and `from`/`to` only for Custom) so it survives a
 * page refresh, not just the in-memory navigation.
 */
@Component({
  selector: 'app-medicine-list',
  standalone: false,
  templateUrl: './medicine-list.component.html',
  styleUrl: './medicine-list.component.scss',
})
export class MedicineListComponent implements OnInit {
  constructor(
    private medicineService: MedicineService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
  ) {}

  medicines: IMedicineCatalogEntry[] = [];
  loading = false;
  importing = false;
  searchTerm = '';
  columns = MedicineListColumns;

  // Catalog can run 20k+ rows after a CSV import — server-paginated for every role, same
  // lazy p-table pattern as doctor-list.
  UI_CONFIG = UI_CONFIG;
  rows: number = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  totalRecords = 0;

  /** Admin-only drill-down context from Doctor Details — set once on init, persisted in the URL, never mutated by the filter afterward. */
  navDoctorId: number | null = null;
  /** Display name for the banner below — so Admin can tell whose usage the "Prescribed" counts belong to without having to remember the id in the URL. */
  navDoctorName: string | null = null;
  /** True once we know the "Prescribed" count on this visit is period-based — set once on init from role/navigation context, never toggles afterward. */
  private hasDateContext = false;

  rangePreset: PrescriptionTrendRangePreset = 'Last30Days';
  customFrom: Date | null = null;
  customTo: Date | null = null;

  get role(): string | null {
    return this.authService.getRole();
  }

  get canManage(): boolean {
    return this.role === 'Admin';
  }

  get isStaffView(): boolean {
    return this.role === 'Staff';
  }

  /** Doctor always gets their own filter; Admin sees one whenever a date range reached this page — via a KPI card link or a Doctor Details drill-down. */
  get canShowDateFilter(): boolean {
    return this.role === 'Doctor' || this.hasDateContext;
  }

  /** Whenever the filter is visible the count is period-based, so the column says "Prescribed"; a plain Admin/Staff visit keeps the lifetime "Total Prescribed" label. */
  get prescribedColumnLabel(): string {
    return this.canShowDateFilter ? 'Prescribed' : 'Total Prescribed';
  }

  /** "Medicines Prescribed by Dr. X" banner text — the period itself is already visible in the filter dropdown next to it, so it's not repeated here. Shown only for an Admin doctor drill-down (navDoctorId + navDoctorName both present). */
  get doctorContextLabel(): string {
    return `Medicines Prescribed by ${this.navDoctorName}`;
  }

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([{ title: 'Medicine Catalog', icon: 'fa-solid fa-pills', href: '/medicines/medicine-list' }]);

    const params = this.route.snapshot.queryParamMap;
    const requestedSearch = params.get('search');
    if (requestedSearch) {
      this.searchTerm = requestedSearch;
    }

    const requestedDoctorId = Number(params.get('doctorId'));
    if (this.role === 'Admin' && requestedDoctorId) {
      this.navDoctorId = requestedDoctorId;
      this.navDoctorName = params.get('doctorName') || `Doctor #${requestedDoctorId}`;
    }

    const requestedPreset = params.get('preset');
    const from = params.get('from');
    const to = params.get('to');
    if (requestedPreset && (RANGE_PRESETS as string[]).includes(requestedPreset)) {
      this.rangePreset = requestedPreset as PrescriptionTrendRangePreset;
      this.hasDateContext = true;
      if (this.rangePreset === 'Custom') {
        // The resolved `to` sent by every caller is "day after the last included day" (see
        // resolvePrescriptionTrendRange's doc comment) — undo that +1 to show the exact end
        // date the user originally picked, not the day after it.
        this.customFrom = parseDateParam(from);
        const parsedTo = parseDateParam(to);
        this.customTo = parsedTo ? new Date(parsedTo.getFullYear(), parsedTo.getMonth(), parsedTo.getDate() - 1) : null;
      }
    } else if (from && to) {
      // Defensive fallback for a caller that forgot to send `preset` — treat the raw bounds as a Custom range as-is.
      this.rangePreset = 'Custom';
      this.hasDateContext = true;
      this.customFrom = parseDateParam(from);
      this.customTo = parseDateParam(to);
    }

    if (this.canShowDateFilter) {
      this.syncUrlWithFilter();
    }
    this.loadMedicines();
  }

  applySearch(): void {
    this.currentPage = 1;
    this.loadMedicines();
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadMedicines();
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadMedicines();
  }

  onRangePresetChange(preset: PrescriptionTrendRangePreset): void {
    this.rangePreset = preset;
    this.syncUrlWithFilter();
    if (preset !== 'Custom') {
      this.loadMedicines();
    }
  }

  onCustomRangeChange(range: { from: Date; to: Date }): void {
    this.customFrom = range.from;
    this.customTo = range.to;
    this.syncUrlWithFilter();
    this.loadMedicines();
  }

  /** Mirrors the active filter into the URL (`preset`, plus `from`/`to` only for Custom) so a page refresh restores it — not just the in-memory nav context. */
  private syncUrlWithFilter(): void {
    const queryParams: Record<string, string | null> = {
      preset: this.rangePreset,
      from: this.rangePreset === 'Custom' && this.customFrom ? DateTimeUtility.formatDateForAPI(this.customFrom) : null,
      to: this.rangePreset === 'Custom' && this.customTo ? DateTimeUtility.formatDateForAPI(this.customTo) : null,
    };
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private resolveRange(): { from?: string; to?: string } {
    if (!this.canShowDateFilter) {
      // Plain Admin/Staff visit — no filter, lifetime hospital-wide count, exactly as before this feature.
      return {};
    }
    return resolvePrescriptionTrendRange(this.rangePreset, this.customFrom, this.customTo);
  }

  loadMedicines(): void {
    this.loading = true;
    const { from, to } = this.resolveRange();

    this.medicineService.getCatalog(this.searchTerm, this.currentPage, this.rows, from, to, this.navDoctorId ?? undefined).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.medicines = response.content.medicines || [];
          this.totalRecords = response.content.totalCount || 0;
        } else {
          this.medicines = [];
          this.totalRecords = 0;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.medicines = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.importing = true;
    this.medicineService.importCsv(file).subscribe({
      next: (response) => {
        this.importing = false;
        if (response && !response.hasError && response.content) {
          const r = response.content;
          this.toast.success({
            summary: 'Import complete',
            detail: `${r.rowsRead} rows read — ${r.inserted} added, ${r.updated} updated, ${r.skipped} skipped.`,
          });
          if (r.errors.length) {
            this.toast.error({ summary: `${r.errors.length} issue(s)`, detail: r.errors.slice(0, 3).join(' ') });
          }
          this.loadMedicines();
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: 'Could not import the CSV file.' });
        }
      },
      error: () => {
        this.importing = false;
        // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
      },
    });
  }

  deactivateMedicine(medicine: IMedicineCatalogEntry, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Deactivate ${medicine.brandName}? It will no longer appear in the prescribing autocomplete, but existing prescriptions that already reference it are unaffected.`,
      header: 'Deactivate Medicine',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.medicineService.deactivate(medicine.medicineId).subscribe({
          next: (response) => {
            if (response && !response.hasError) {
              this.toast.success({ detail: `${medicine.brandName} deactivated.` });
              this.loadMedicines();
            } else if (!response?.decentMessage) {
              this.toast.error({ detail: 'Could not deactivate this medicine.' });
            }
          },
          error: () => {
            // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
          },
        });
      },
    });
  }
}
