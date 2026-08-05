import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { AuthService } from '@core/services/auth/auth.service';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { of } from 'rxjs';
import { ManageDoctorComponent } from './manage-doctor.component';

describe('ManageDoctorComponent', () => {
  let component: ManageDoctorComponent;
  let fixture: ComponentFixture<ManageDoctorComponent>;
  let doctorServiceSpy: jasmine.SpyObj<DoctorService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let confirmationServiceSpy: jasmine.SpyObj<ConfirmationService>;

  function configure(id: string | null, getDoctorByIdResponse?: any) {
    doctorServiceSpy = jasmine.createSpyObj('DoctorService', ['getDoctorById', 'addDoctor', 'updateDoctor']);
    if (getDoctorByIdResponse) {
      doctorServiceSpy.getDoctorById.and.returnValue(of(getDoctorByIdResponse));
    }
    authServiceSpy = jasmine.createSpyObj('AuthService', ['resetPassword']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    const breadcrumbSpy = jasmine.createSpyObj('BreadcrumbService', ['setBreadcrumbs']);

    TestBed.configureTestingModule({
      declarations: [ManageDoctorComponent],
      imports: [ReactiveFormsModule, SelectModule, DatePickerModule, InputNumberModule, DialogModule],
      providers: [
        { provide: DoctorService, useValue: doctorServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: BreadcrumbService, useValue: breadcrumbSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap(id ? { id } : {})) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageDoctorComponent);
    component = fixture.componentInstance;
  }

  const existingDoctorResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: {
      profile: { doctorId: 1, userId: 1, fullName: 'Dr. Existing', username: 'existing', email: 'existing@example.com', phone: '01711111111', isActive: true },
      performance: {},
    },
  };

  it('should not call addDoctor and should mark fields touched when the form is invalid', () => {
    configure(null);
    fixture.detectChanges();

    component.onSubmit();

    expect(component.doctorForm.invalid).toBeTrue();
    expect(doctorServiceSpy.addDoctor).not.toHaveBeenCalled();
  });

  it('should show the temporary password dialog after a successful create', () => {
    configure(null);
    fixture.detectChanges();
    doctorServiceSpy.addDoctor.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: { doctorId: 1, userId: 1, username: 'new.doctor', temporaryPassword: 'Temp123!' } } as any),
    );

    component.doctorForm.setValue({
      username: 'new.doctor',
      fullName: 'Dr. Jane Doe',
      email: null,
      phone: '01712345678',
      department: null,
      specialization: null,
      qualification: null,
      licenseNumber: null,
      experienceYears: null,
      gender: null,
      joiningDate: null,
      photoBase64: null,
      isActive: true,
    });

    component.onSubmit();

    expect(component.showTemporaryPasswordDialog).toBeTrue();
    expect(component.createdTemporaryPassword).toBe('Temp123!');
    expect(component.isPasswordReset).toBeFalse();
  });

  it('should navigate to the doctor list when closing the dialog after a create', () => {
    configure(null);
    fixture.detectChanges();
    component.createdTemporaryPassword = 'Temp123!';
    component.isPasswordReset = false;

    component.onTemporaryPasswordDialogClose();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/doctors/doctor-list']);
  });

  it('should load the existing doctor and disable the username field in edit mode', () => {
    configure('1', existingDoctorResponse);
    fixture.detectChanges();

    expect(component.isEditMode).toBeTrue();
    expect(component.doctorForm.get('username')?.disabled).toBeTrue();
    expect(component.doctorForm.get('fullName')?.value).toBe('Dr. Existing');
    expect(component.userId).toBe(1);
  });

  it('should reset the password after confirmation and show the dialog without navigating away', () => {
    configure('1', existingDoctorResponse);
    fixture.detectChanges();
    confirmationServiceSpy.confirm.and.callFake((options: any) => options.accept());
    authServiceSpy.resetPassword.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { temporaryPassword: 'NewTemp456!' } } as any));

    component.resetPassword({ target: null } as any);

    expect(authServiceSpy.resetPassword).toHaveBeenCalledWith(1);
    expect(component.createdTemporaryPassword).toBe('NewTemp456!');
    expect(component.isPasswordReset).toBeTrue();
    expect(component.showTemporaryPasswordDialog).toBeTrue();

    component.onTemporaryPasswordDialogClose();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should not reset the password if the confirmation is declined', () => {
    configure('1', existingDoctorResponse);
    fixture.detectChanges();
    confirmationServiceSpy.confirm.and.callFake(() => confirmationServiceSpy);

    component.resetPassword({ target: null } as any);

    expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
  });
});
