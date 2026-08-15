import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrescriptionService } from '@core/services/prescriptions/prescription.service';
import { DoctorPreferencesService } from '@core/services/doctor-preferences/doctor-preferences.service';
import { PatientService } from '@core/services/patients/patient.service';
import { ToastService } from '@core/services/misc/toast.service';
import { IDoctorPatientQueueItem, PatientQueueFilter } from '@core/interfaces/patients/patient.interface';
import { DefaultPatientQueueFilter, PatientQueueFilterOptions } from '@core/constants/patient-queue-filter-options';
import { UI_CONFIG } from '@core/constants';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {
  IPrescriptionContent,
  IPrescriptionDocument,
  IPrescriptionListItem,
  PrescriptionLanguage,
} from '@core/interfaces/prescriptions/prescription.interface';

/**
 * The single authoring entry point (US-018/019/020) — landed here from Today's Queue
 * (?consultationId=), a quick-create patient pick (?patientId=), or a resumed draft
 * (?draftId=). Mirrors the reference prototype's "one route, disambiguated by query
 * params" design (see StartOrResumePrescriptionRequest's doc comment on the backend).
 */
@Component({
  selector: 'app-authoring',
  standalone: false,
  templateUrl: './authoring.component.html',
  styleUrl: './authoring.component.scss',
})
export class AuthoringComponent implements OnInit, OnDestroy {
  document: IPrescriptionDocument | null = null;
  loading = true;
  saving = false;

  duplicateActive: { consultationId: number; displayCode: string; tokenNumber: string; status: string } | null = null;
  unfinishedDrafts: IPrescriptionListItem[] | null = null;
  finalizeMissing: string[] = [];

  needsPatientPick = false;
  patientSearchTerm = '';
  queueFilter: PatientQueueFilter = DefaultPatientQueueFilter;
  queueFilterOptions = PatientQueueFilterOptions;
  patientResults: IDoctorPatientQueueItem[] = [];
  patientResultsLoading = false;

  private consultationId: number | null = null;
  private patientId: number | null = null;
  private draftId: number | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly searchTermChanges$ = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionService: PrescriptionService,
    private doctorPreferencesService: DoctorPreferencesService,
    private patientService: PatientService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.consultationId = params.get('consultationId') ? Number(params.get('consultationId')) : null;
    this.patientId = params.get('patientId') ? Number(params.get('patientId')) : null;
    this.draftId = params.get('draftId') ? Number(params.get('draftId')) : null;

    if (!this.consultationId && !this.patientId && !this.draftId) {
      this.needsPatientPick = true;
      this.loading = false;
      this.searchTermChanges$.pipe(debounceTime(UI_CONFIG.searchDebounceTime), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
        this.loadQueue();
      });
      this.loadQueue();
      return;
    }
    this.start(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPatientSearchTermChange(value: string): void {
    this.patientSearchTerm = value;
    this.searchTermChanges$.next(value);
  }

  onQueueFilterChange(): void {
    this.loadQueue();
  }

  loadQueue(): void {
    this.patientResultsLoading = true;
    this.patientService.getDoctorQueue({ queueFilter: this.queueFilter, searchTerm: this.patientSearchTerm || undefined }).subscribe({
      next: (res) => {
        this.patientResults = !res.hasError && res.content ? res.content.patients : [];
        this.patientResultsLoading = false;
      },
      error: () => {
        this.patientResults = [];
        this.patientResultsLoading = false;
      },
    });
  }

  get emptyQueueMessage(): string {
    switch (this.queueFilter) {
      case 'TodayQueue':
        return 'No patients waiting in today\'s consultation queue. Switch to "All Registered Patients" to prescribe for someone outside today\'s queue.';
      case 'NotConsultedToday':
        return 'Every registered patient has already been seen today.';
      case 'CompletedToday':
        return "You haven't completed any consultations today yet.";
      default:
        return 'No patients found. Try adjusting your search.';
    }
  }

  statusBadge(patient: IDoctorPatientQueueItem): { label: string; modifierClass: string } {
    switch (patient.todayConsultationStatus) {
      case 'Waiting':
        return { label: 'Waiting', modifierClass: 'status-badge--waiting' };
      case 'InConsultation':
        return { label: 'In Progress', modifierClass: 'status-badge--waiting' };
      case 'Completed':
        return { label: 'Completed', modifierClass: 'status-badge--completed' };
      default:
        return { label: 'Not Consulted', modifierClass: 'status-badge--not-consulted' };
    }
  }

  rowActionLabel(patient: IDoctorPatientQueueItem): string {
    if (patient.todayConsultationStatus === 'Waiting' || patient.todayConsultationStatus === 'InConsultation') return 'Continue';
    if (patient.todayConsultationStatus === 'Completed') return 'View Prescription';
    return 'Start Consultation';
  }

  selectPatientRow(patient: IDoctorPatientQueueItem): void {
    if (patient.todayConsultationStatus === 'Waiting' || patient.todayConsultationStatus === 'InConsultation') {
      this.needsPatientPick = false;
      this.router.navigate(['/prescriptions'], { queryParams: { consultationId: patient.todayConsultationId } });
      this.consultationId = patient.todayConsultationId ?? null;
      this.patientId = null;
      this.draftId = null;
      this.start(false);
      return;
    }

    if (patient.todayConsultationStatus === 'Completed' && patient.todayPrescriptionId) {
      this.router.navigate(['/prescriptions/view', patient.todayPrescriptionId]);
      return;
    }

    this.pickPatient(patient);
  }

  pickPatient(patient: IDoctorPatientQueueItem): void {
    this.needsPatientPick = false;
    this.patientId = patient.patientId;
    this.router.navigate(['/prescriptions'], { queryParams: { patientId: patient.patientId } });
    this.start(false);
  }

  private start(force: boolean): void {
    this.loading = true;
    this.prescriptionService
      .start({ consultationId: this.consultationId, patientId: this.patientId, prescriptionId: this.draftId, force })
      .subscribe({
        next: (res) => {
          this.loading = false;
          const body = res.content;
          if (body.duplicateActiveFound) {
            this.duplicateActive = body.existingActiveConsultation ?? null;
            return;
          }
          if (body.unfinishedDraftFound) {
            this.unfinishedDrafts = body.unfinishedDrafts;
            return;
          }
          this.document = body.document;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  proceedAnyway(): void {
    this.duplicateActive = null;
    this.unfinishedDrafts = null;
    this.start(true);
  }

  continueExisting(): void {
    if (!this.duplicateActive) return;
    const consultationId = this.duplicateActive.consultationId;
    this.duplicateActive = null;
    this.router.navigate(['/prescriptions'], { queryParams: { consultationId } });
    this.consultationId = consultationId;
    this.patientId = null;
    this.draftId = null;
    this.start(false);
  }

  resumeDraft(draft: IPrescriptionListItem): void {
    this.router.navigate(['/prescriptions'], { queryParams: { draftId: draft.prescriptionId } });
    this.draftId = draft.prescriptionId;
    this.consultationId = null;
    this.patientId = null;
    this.unfinishedDrafts = null;
    this.start(false);
  }

  onContentChange(content: IPrescriptionContent): void {
    if (!this.document) return;
    this.document = { ...this.document, content };
  }

  setLanguage(language: PrescriptionLanguage): void {
    if (!this.document || this.document.language === language) return;
    this.document = { ...this.document, language };
    // US-024: remembered as the doctor's default for their next new prescription.
    this.doctorPreferencesService
      .update({ preferredTemplateId: this.document.doctor.preferredTemplateId, preferredLanguage: language })
      .subscribe();
  }

  saveDraft(): void {
    if (!this.document) return;
    this.saving = true;
    this.prescriptionService.saveDraft(this.document.prescriptionId, { language: this.document.language, content: this.document.content }).subscribe({
      next: (res) => {
        this.saving = false;
        this.document = res.content;
        this.toast.success({ detail: 'Draft saved.' });
        this.router.navigate(['/prescriptions/drafts']);
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  finalize(): void {
    if (!this.document) return;
    const missing: string[] = [];
    if (this.document.content.diagnoses.length === 0) missing.push('At least one diagnosis');
    if (this.document.content.medicines.length === 0) missing.push('At least one medicine');
    if (!this.document.doctor.signatureUrl) missing.push('Your signature (set it in Prescription Preferences)');
    if (!this.document.doctor.preferredTemplateId) missing.push('A preferred template (set it in Prescription Preferences)');

    if (missing.length > 0) {
      this.finalizeMissing = missing;
      return;
    }
    this.finalizeMissing = [];

    this.saving = true;
    this.prescriptionService.finalize(this.document.prescriptionId, { language: this.document.language, content: this.document.content }).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success({ detail: 'Prescription finalized.' });
        this.router.navigate(['/prescriptions/finalized'], { state: { justFinalizedId: this.document?.prescriptionId } });
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}
