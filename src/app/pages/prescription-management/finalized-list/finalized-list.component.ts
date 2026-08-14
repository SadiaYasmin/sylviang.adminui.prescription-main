import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PrescriptionService } from '@core/services/prescriptions/prescription.service';
import { IPrescriptionListItem } from '@core/interfaces/prescriptions/prescription.interface';
import { UI_CONFIG } from '@core/constants';
import { DateTimeUtility } from '@core/utils/date-time.utility';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface NavState {
  justFinalizedId?: number;
}

/** US-030: a doctor's own finalized prescriptions; a just-finalized one is banner-highlighted. */
@Component({
  selector: 'app-finalized-list',
  standalone: false,
  templateUrl: './finalized-list.component.html',
  styleUrl: './finalized-list.component.scss',
})
export class FinalizedListComponent implements OnInit, OnDestroy {
  finalized: IPrescriptionListItem[] = [];
  loading = true;
  totalRecords = 0;
  UI_CONFIG = UI_CONFIG;
  rows = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  searchTerm = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;

  justFinalizedId: number | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly searchTermChanges$ = new Subject<string>();

  constructor(private prescriptionService: PrescriptionService, private router: Router) {
    const state = this.router.getCurrentNavigation()?.extras?.state as NavState | undefined;
    this.justFinalizedId = state?.justFinalizedId ?? null;
  }

  get justFinalizedItem(): IPrescriptionListItem | null {
    if (!this.justFinalizedId) return null;
    return this.finalized.find((f) => f.prescriptionId === this.justFinalizedId) ?? null;
  }

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.searchTermChanges$.pipe(debounceTime(UI_CONFIG.searchDebounceTime), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage = 1;
      this.loadFinalized();
    });

    this.loadFinalized();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchTermChange(value: string): void {
    this.searchTerm = value;
    this.searchTermChanges$.next(value);
  }

  applyDateFilter(): void {
    this.currentPage = 1;
    this.loadFinalized();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.fromDate = null;
    this.toDate = null;
    this.currentPage = 1;
    this.loadFinalized();
  }

  loadFinalized(): void {
    this.loading = true;
    this.prescriptionService
      .getFinalized({
        searchTerm: this.searchTerm || undefined,
        fromDate: this.fromDate ? DateTimeUtility.formatDateForAPI(this.fromDate) : undefined,
        toDate: this.toDate ? DateTimeUtility.formatDateForAPI(this.toDate) : undefined,
        page: this.currentPage,
        pageSize: this.rows,
      })
      .subscribe({
        next: (res) => {
          if (!res.hasError && res.content) {
            this.finalized = res.content.prescriptions || [];
            this.totalRecords = res.content.totalCount || 0;
          } else {
            this.finalized = [];
            this.totalRecords = 0;
          }
          this.loading = false;
        },
        error: () => {
          this.finalized = [];
          this.totalRecords = 0;
          this.loading = false;
        },
      });
  }

  onPageChange(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadFinalized();
  }

  dismissBanner(): void {
    this.justFinalizedId = null;
  }

  view(item: IPrescriptionListItem): void {
    this.router.navigate(['/prescriptions/view', item.prescriptionId]);
  }

  print(item: IPrescriptionListItem): void {
    this.router.navigate(['/prescriptions/view', item.prescriptionId], { queryParams: { action: 'print' } });
  }

  download(item: IPrescriptionListItem): void {
    this.router.navigate(['/prescriptions/view', item.prescriptionId], { queryParams: { action: 'download' } });
  }
}
