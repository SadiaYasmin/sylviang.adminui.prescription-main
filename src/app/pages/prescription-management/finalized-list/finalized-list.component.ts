import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { PrescriptionService } from '@core/services/prescriptions/prescription.service';
import { IPrescriptionListItem } from '@core/interfaces/prescriptions/prescription.interface';
import { UI_CONFIG } from '@core/constants';
import { DateTimeUtility } from '@core/utils/date-time.utility';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface NavState {
  justFinalizedId?: number;
}

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

  constructor(private prescriptionService: PrescriptionService, private router: Router, private route: ActivatedRoute, private breadcrumbService: BreadcrumbService) {
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
    this.breadcrumbService.setBreadcrumbs([
      { title: 'Prescriptions', icon: 'fa-solid fa-file-prescription', href: '/prescriptions' },
      { title: 'Finalized Prescriptions', icon: 'fa-solid fa-file-circle-check', href: '/prescriptions/finalized' },
    ]);

    // Doctor Dashboard's "Finalized Prescriptions" card carries its selected period here as
    // `fromDate`/`toDate` query params — populate this page's own existing From/To fields
    // from them rather than adding a second period control. The dashboard's resolver sends an
    // EXCLUSIVE `toDate` (the day after the last included day, this app's usual convention),
    // but this page's own filter is inclusive (backend does `EndOfDayUtc(toDate)`) — subtract
    // a day so the two conventions line up and the card's count matches what renders here.
    const params = this.route.snapshot.queryParamMap;
    this.fromDate = parseDateParam(params.get('fromDate'));
    const exclusiveToDate = parseDateParam(params.get('toDate'));
    this.toDate = exclusiveToDate ? new Date(exclusiveToDate.getFullYear(), exclusiveToDate.getMonth(), exclusiveToDate.getDate() - 1) : null;

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
