import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { PrescriptionService } from '@core/services/prescriptions/prescription.service';
import { IPrescriptionListItem } from '@core/interfaces/prescriptions/prescription.interface';
import { UI_CONFIG } from '@core/constants';
import { DateTimeUtility } from '@core/utils/date-time.utility';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/** US-029: a doctor's own drafts, resumable. */
@Component({
  selector: 'app-draft-list',
  standalone: false,
  templateUrl: './draft-list.component.html',
  styleUrl: './draft-list.component.scss',
})
export class DraftListComponent implements OnInit, OnDestroy {
  drafts: IPrescriptionListItem[] = [];
  loading = true;
  totalRecords = 0;
  UI_CONFIG = UI_CONFIG;
  rows = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  searchTerm = '';
  date: Date | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly searchTermChanges$ = new Subject<string>();

  constructor(private prescriptionService: PrescriptionService, private router: Router, private breadcrumbService: BreadcrumbService) {}

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { title: 'Prescriptions', icon: 'fa-solid fa-file-prescription', href: '/prescriptions' },
      { title: 'Draft Prescriptions', icon: 'fa-solid fa-file-circle-question', href: '/prescriptions/drafts' },
    ]);

    this.searchTermChanges$.pipe(debounceTime(UI_CONFIG.searchDebounceTime), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage = 1;
      this.loadDrafts();
    });

    this.loadDrafts();
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
    this.loadDrafts();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.date = null;
    this.currentPage = 1;
    this.loadDrafts();
  }

  loadDrafts(): void {
    this.loading = true;
    this.prescriptionService
      .getDrafts({
        searchTerm: this.searchTerm || undefined,
        date: this.date ? DateTimeUtility.formatDateForAPI(this.date) : undefined,
        page: this.currentPage,
        pageSize: this.rows,
      })
      .subscribe({
        next: (res) => {
          if (!res.hasError && res.content) {
            this.drafts = res.content.prescriptions || [];
            this.totalRecords = res.content.totalCount || 0;
          } else {
            this.drafts = [];
            this.totalRecords = 0;
          }
          this.loading = false;
        },
        error: () => {
          this.drafts = [];
          this.totalRecords = 0;
          this.loading = false;
        },
      });
  }

  onPageChange(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadDrafts();
  }

  newPrescription(): void {
    this.router.navigate(['/prescriptions']);
  }

  continueDraft(draft: IPrescriptionListItem): void {
    this.router.navigate(['/prescriptions'], { queryParams: { draftId: draft.prescriptionId } });
  }

  view(draft: IPrescriptionListItem): void {
    this.router.navigate(['/prescriptions/view', draft.prescriptionId]);
  }
}
