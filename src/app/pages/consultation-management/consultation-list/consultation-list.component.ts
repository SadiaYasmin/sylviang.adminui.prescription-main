import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { UI_CONFIG } from '@app/@core/constants';
import { DateTimeUtility } from '@app/@core/utils/date-time.utility';
import {
  ConsultationDateMode,
  ConsultationStatus,
  IConsultationDetailsResponse,
  IConsultationListItem,
  IConsultationListSummary,
} from '@core/interfaces/consultations/consultation.interface';
import { IDoctorSummary } from '@core/interfaces/doctors/doctor.interface';
import { ConsultationService } from '@core/services/consultations/consultation.service';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConsultationListColumns } from './consultation-list.component.constants';

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

@Component({
  selector: 'app-consultation-list',
  standalone: false,
  templateUrl: './consultation-list.component.html',
  styleUrl: './consultation-list.component.scss',
})
export class ConsultationListComponent implements OnInit {
  constructor(
    private consultationService: ConsultationService,
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
  ) {}

  consultations: IConsultationListItem[] = [];
  summary: IConsultationListSummary = { total: 0, waiting: 0, inProgress: 0, completed: 0, draft: 0 };
  loading = false;
  totalRecords = 0;
  UI_CONFIG = UI_CONFIG;
  rows = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  columns = ConsultationListColumns;

  searchTerm = '';
  dateMode: ConsultationDateMode = 'Today';
  customDate: Date | null = null;
  fromDate: Date | null = null;
  toDate: Date | null = null;
  doctorId: number | null = null;
  status: ConsultationStatus | null = null;

  doctors: IDoctorSummary[] = [];

  dateModeOptions = [
    { label: 'Today', value: 'Today' },
    { label: 'Yesterday', value: 'Yesterday' },
    { label: 'Custom Date', value: 'Custom' },
    { label: 'Date Range', value: 'Range' },
    { label: 'All Time', value: 'All' },
  ];

  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Waiting', value: 'Waiting' },
    { label: 'In Progress', value: 'InConsultation' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Completed', value: 'Completed' },
  ];

  showDetailsDialog = false;
  detailsLoading = false;
  details: IConsultationDetailsResponse | null = null;

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  get isCustomDateMode(): boolean {
    return this.dateMode === 'Custom';
  }

  get isRangeDateMode(): boolean {
    return this.dateMode === 'Range';
  }

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { title: 'Consultations', icon: 'fa-solid fa-notes-medical', href: '/consultations/consultation-list' },
    ]);

    const params = this.route.snapshot.queryParamMap;

    const requestedDateMode = params.get('dateMode');
    if (requestedDateMode === 'Today' || requestedDateMode === 'All' || requestedDateMode === 'Range') {
      this.dateMode = requestedDateMode;
    }
    if (this.dateMode === 'Range') {
      this.fromDate = parseDateParam(params.get('fromDate'));
      this.toDate = parseDateParam(params.get('toDate'));
    }

    const requestedStatus = params.get('status');
    if (requestedStatus === 'Waiting' || requestedStatus === 'InConsultation' || requestedStatus === 'Completed') {
      this.status = requestedStatus;
    }

    const requestedDoctorId = Number(params.get('doctorId'));
    if (requestedDoctorId > 0) {
      this.doctorId = requestedDoctorId;
    }

    this.loadDoctors();
    this.loadConsultations();
  }

  private loadDoctors(): void {
    this.doctorService.getDoctors({ pageSize: 100 }).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.doctors = response.content.doctors || [];
        }
      },
    });
  }

  applySearch(): void {
    this.currentPage = 1;
    this.loadConsultations();
  }

  /**
   * The Total/Waiting/In Progress/Draft/Completed stat tiles are shortcuts onto the same
   * status filter as the dropdown, always widened to All Time first — a Draft or Waiting
   * record from last week must never be hidden just because "Today" was still selected.
   * Search term and doctor filter are left as-is, matching every other filter interaction.
   */
  filterByStatusCard(status: ConsultationStatus | null): void {
    this.dateMode = 'All';
    this.status = status;
    this.currentPage = 1;
    this.loadConsultations();
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.dateMode = 'Today';
    this.customDate = null;
    this.fromDate = null;
    this.toDate = null;
    this.doctorId = null;
    this.status = null;
    this.currentPage = 1;
    this.loadConsultations();
  }

  loadConsultations(): void {
    this.loading = true;

    this.consultationService
      .getConsultations({
        page: this.currentPage,
        pageSize: this.rows,
        searchTerm: this.searchTerm || undefined,
        dateMode: this.dateMode,
        date: this.isCustomDateMode ? DateTimeUtility.formatDateForAPI(this.customDate) || undefined : undefined,
        fromDate: this.isRangeDateMode ? DateTimeUtility.formatDateForAPI(this.fromDate) || undefined : undefined,
        toDate: this.isRangeDateMode ? DateTimeUtility.formatDateForAPI(this.toDate) || undefined : undefined,
        doctorId: this.doctorId || undefined,
        status: this.status || undefined,
      })
      .subscribe({
        next: (response) => {
          if (!response.hasError && response.content) {
            this.consultations = response.content.consultations || [];
            this.totalRecords = response.content.totalCount || 0;
            this.summary = response.content.summary;
          } else {
            this.consultations = [];
            this.totalRecords = 0;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.consultations = [];
          this.totalRecords = 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onPageChange(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadConsultations();
  }

  displayStatus(status: string): string {
    return status === 'InConsultation' ? 'In Progress' : status;
  }

  viewDetails(item: IConsultationListItem): void {
    this.showDetailsDialog = true;
    this.detailsLoading = true;
    this.details = null;

    this.consultationService.getConsultationById(item.consultationId).subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.details = response.content;
        } else {
          this.toast.error({ detail: 'Could not load consultation details.' });
        }
        this.detailsLoading = false;
      },
      error: () => {
        this.toast.error({ detail: 'Could not load consultation details.' });
        this.detailsLoading = false;
      },
    });
  }

  closeDetailsDialog(): void {
    this.showDetailsDialog = false;
    this.details = null;
  }
}
