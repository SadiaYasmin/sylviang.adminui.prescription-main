import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { IPatientSummary } from '@core/interfaces/patients/patient.interface';
import { IAssignedDoctorSummary, ISuggestedDoctor } from '@core/interfaces/consultations/consultation.interface';
import { ConsultationService } from '@core/services/consultations/consultation.service';
import { ToastService } from '@core/services/misc/toast.service';

@Component({
  selector: 'app-create-consultation-dialog',
  standalone: false,
  templateUrl: './create-consultation-dialog.component.html',
  styleUrl: './create-consultation-dialog.component.scss',
})
export class CreateConsultationDialogComponent implements OnChanges {
  constructor(
    private consultationService: ConsultationService,
    private toast: ToastService,
  ) {}

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() patient: IPatientSummary | null = null;

  @Output() created = new EventEmitter<void>();

  doctors: IAssignedDoctorSummary[] = [];
  selectedDoctorId: number | null = null;
  submitting = false;

  showSuggestionPanel = false;
  patientNote = '';
  suggesting = false;
  suggestions: ISuggestedDoctor[] = [];
  suggestionSummary: string | null = null;
  suggestionAiUsed = true;
  suggestionRequested = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      this.loadDoctors();
    }
  }

  private resetForm(): void {
    this.selectedDoctorId = null;
    this.submitting = false;
    this.showSuggestionPanel = false;
    this.patientNote = '';
    this.suggesting = false;
    this.suggestions = [];
    this.suggestionSummary = null;
    this.suggestionAiUsed = true;
    this.suggestionRequested = false;
  }

  toggleSuggestionPanel(): void {
    this.showSuggestionPanel = !this.showSuggestionPanel;
  }

  getSuggestions(): void {
    if (!this.patientNote.trim() || this.suggesting) return;

    this.suggesting = true;
    this.suggestionRequested = true;
    this.consultationService.suggestDoctor({ patientNote: this.patientNote.trim() }).subscribe({
      next: (response) => {
        this.suggesting = false;
        if (!response.hasError && response.content) {
          this.suggestions = response.content.suggestions || [];
          this.suggestionSummary = response.content.summary;
          this.suggestionAiUsed = response.content.aiUsed;
        } else {
          this.suggestions = [];
        }
      },
      error: () => {
        this.suggesting = false;
        this.suggestions = [];
      },
    });
  }

  pickSuggestion(suggestion: ISuggestedDoctor): void {
    this.selectedDoctorId = suggestion.doctorId;
  }

  private loadDoctors(): void {
    this.consultationService.getMyAssignedDoctors().subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.doctors = response.content || [];
        } else {
          this.doctors = [];
        }
      },
      error: () => {
        this.doctors = [];
      },
    });
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSubmit(): void {
    if (!this.patient || !this.selectedDoctorId || this.submitting) return;

    this.submit();
  }

  private submit(): void {
    if (!this.patient || !this.selectedDoctorId) return;

    this.submitting = true;
    this.consultationService
      .createConsultation({
        patientId: this.patient.patientId,
        doctorId: this.selectedDoctorId,
        // The API applies today's server-local date; no client-controlled date is sent.
        visitDate: null,
      })
      .subscribe({
        next: (response) => {
          this.submitting = false;
          if (response && !response.hasError && response.content) {
            if (response.content.duplicateFound) {
              const existing = response.content.existingConsultation;
              this.toast.warn({
                detail: existing
                  ? `${this.patient?.name} already has an active consultation today (${existing.displayCode}).`
                  : `${this.patient?.name} already has an active consultation today.`,
              });
            } else {
              const consultation = response.content.consultation;
              this.toast.success({
                detail: consultation ? `Consultation ${consultation.displayCode} created (${consultation.tokenNumber}).` : 'Consultation created successfully.',
              });
              this.closeDialog();
              this.created.emit();
            }
          } else if (!response?.decentMessage) {
            this.toast.error({ detail: 'Could not create the consultation.' });
          }
        },
        error: () => {
          this.submitting = false;
          // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
        },
      });
  }

}
