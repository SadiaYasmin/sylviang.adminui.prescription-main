import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsultationService } from '@core/services/consultations/consultation.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { CreateConsultationDialogComponent } from './create-consultation-dialog.component';

describe('CreateConsultationDialogComponent', () => {
  let component: CreateConsultationDialogComponent;
  let fixture: ComponentFixture<CreateConsultationDialogComponent>;
  let consultationServiceSpy: jasmine.SpyObj<ConsultationService>;
  let confirmationServiceSpy: jasmine.SpyObj<ConfirmationService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const patient = { patientId: 1, name: 'Jane Roy', phone: '01712345678' } as any;
  const doctorsResponse = { hasError: false, decentMessage: 'ok', content: [{ doctorId: 2, fullName: 'Dr. John' }] };

  beforeEach(() => {
    consultationServiceSpy = jasmine.createSpyObj('ConsultationService', ['getMyAssignedDoctors', 'createConsultation']);
    consultationServiceSpy.getMyAssignedDoctors.and.returnValue(of(doctorsResponse as any));
    confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'warn']);

    TestBed.configureTestingModule({
      declarations: [CreateConsultationDialogComponent],
      providers: [
        { provide: ConsultationService, useValue: consultationServiceSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateConsultationDialogComponent);
    component = fixture.componentInstance;
    component.patient = patient;
  });

  it('should load assigned doctors when opened', () => {
    component.visible = false;
    fixture.detectChanges();

    component.visible = true;
    component.ngOnChanges({ visible: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false } });

    expect(consultationServiceSpy.getMyAssignedDoctors).toHaveBeenCalled();
    expect(component.doctors.length).toBe(1);
  });

  it('should reset the form fields when reopened', () => {
    component.selectedDoctorId = 99;
    component.visible = true;
    component.ngOnChanges({ visible: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false } });

    expect(component.selectedDoctorId).toBeNull();
  });

  it('should not submit without a selected doctor', () => {
    component.selectedDoctorId = null;
    component.onSubmit();

    expect(consultationServiceSpy.createConsultation).not.toHaveBeenCalled();
  });

  it('should create a consultation and emit created on success', () => {
    component.selectedDoctorId = 2;
    consultationServiceSpy.createConsultation.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: { duplicateFound: false, consultation: { consultationId: 1, displayCode: 'CN-2026-0001', tokenNumber: 'T-01', status: 'Waiting' } } } as any),
    );
    spyOn(component.created, 'emit');
    spyOn(component.visibleChange, 'emit');

    component.onSubmit();

    expect(toastServiceSpy.success).toHaveBeenCalled();
    expect(component.created.emit).toHaveBeenCalled();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  });

  it('should warn and keep the dialog open when a duplicate consultation is found', () => {
    component.selectedDoctorId = 2;
    consultationServiceSpy.createConsultation.and.returnValue(
      of({
        hasError: false,
        decentMessage: 'ok',
        content: { duplicateFound: true, existingConsultation: { consultationId: 1, displayCode: 'CN-2026-0001', tokenNumber: 'T-01', status: 'Waiting' } },
      } as any),
    );

    component.onSubmit();

    expect(toastServiceSpy.warn).toHaveBeenCalled();
    expect(toastServiceSpy.success).not.toHaveBeenCalled();
  });

  it('should clear submitting state on error', () => {
    component.selectedDoctorId = 2;
    consultationServiceSpy.createConsultation.and.returnValue(throwError(() => new Error('network error')));

    component.onSubmit();

    expect(component.submitting).toBeFalse();
  });

  it('should emit visibleChange(false) when closed', () => {
    spyOn(component.visibleChange, 'emit');
    component.closeDialog();

    expect(component.visible).toBeFalse();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  });
});
