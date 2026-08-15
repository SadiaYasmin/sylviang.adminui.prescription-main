import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IMedicineCatalogEntry, IMedicineSummary } from '@core/interfaces/medicines/medicine.interface';
import { AuthService } from '@core/services/auth/auth.service';
import { MedicineService } from '@core/services/medicines/medicine.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';
import { MedicineListColumns } from './medicine-list.component.constants';

/**
 * US-036/037/038/039/040. Staff gets the plain catalog (via `search()`, no analytics
 * column/sort at all — the backend never sends `totalPrescribed` to them, this component
 * just also never renders a column for a field that isn't in `medicines` for that role).
 * Admin/Doctor get the catalog view (`getCatalog()`, includes Total Prescribed, sorted by
 * it descending already by the backend). Only Admin sees the Add/Edit/Deactivate actions.
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
  ) {}

  medicines: (IMedicineSummary | IMedicineCatalogEntry)[] = [];
  loading = false;
  searchTerm = '';
  columns = MedicineListColumns;

  get role(): string | null {
    return this.authService.getRole();
  }

  get showAnalytics(): boolean {
    return this.role === 'Admin' || this.role === 'Doctor';
  }

  get canManage(): boolean {
    return this.role === 'Admin';
  }

  get skeletonItems() {
    return Array(5)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  asCatalogEntry(medicine: IMedicineSummary | IMedicineCatalogEntry): IMedicineCatalogEntry {
    return medicine as IMedicineCatalogEntry;
  }

  ngOnInit(): void {
    this.loadMedicines();
  }

  applySearch(): void {
    this.loadMedicines();
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.loadMedicines();
  }

  loadMedicines(): void {
    this.loading = true;
    const request$ = this.showAnalytics ? this.medicineService.getCatalog(this.searchTerm) : this.medicineService.search(this.searchTerm);

    request$.subscribe({
      next: (response) => {
        this.medicines = !response.hasError && response.content ? response.content : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.medicines = [];
        this.loading = false;
        this.cdr.detectChanges();
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
