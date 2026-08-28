import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UI_CONFIG } from '@app/@core/constants';
import { IMedicineCatalogEntry } from '@core/interfaces/medicines/medicine.interface';
import { AuthService } from '@core/services/auth/auth.service';
import { MedicineService } from '@core/services/medicines/medicine.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';
import { MedicineListColumns } from './medicine-list.component.constants';

/**
 * US-036/037/038/039/040. Admin, Doctor, and Staff all see the same catalog view — same rows,
 * same `getCatalog()` endpoint, same pagination — except Staff doesn't see the Total Prescribed
 * column (prescribing volume isn't relevant to a Staff user's job). Only write access
 * (Add/Import/Edit/Deactivate) stays Admin-only.
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

  get role(): string | null {
    return this.authService.getRole();
  }

  get canManage(): boolean {
    return this.role === 'Admin';
  }

  get isStaffView(): boolean {
    return this.role === 'Staff';
  }

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    const requestedSearch = this.route.snapshot.queryParamMap.get('search');
    if (requestedSearch) {
      this.searchTerm = requestedSearch;
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

  loadMedicines(): void {
    this.loading = true;

    this.medicineService.getCatalog(this.searchTerm, this.currentPage, this.rows).subscribe({
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
