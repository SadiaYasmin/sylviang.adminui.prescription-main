import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { DoctorListComponent } from './doctor-list.component';

describe('DoctorListComponent', () => {
  let component: DoctorListComponent;
  let fixture: ComponentFixture<DoctorListComponent>;
  let doctorServiceSpy: jasmine.SpyObj<DoctorService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let confirmationServiceSpy: jasmine.SpyObj<ConfirmationService>;

  const listResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: {
      doctors: [{ doctorId: 1, userId: 1, fullName: 'Dr. Jane Doe', username: 'jane', phone: '01712345678', isActive: true }],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      summary: { totalDoctors: 1, activeDoctors: 1, totalPrescriptions: 0, totalMedicineEntries: 0 },
    },
  };

  beforeEach(async () => {
    doctorServiceSpy = jasmine.createSpyObj('DoctorService', ['getDoctors', 'deactivateDoctor']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    doctorServiceSpy.getDoctors.and.returnValue(of(listResponse as any));

    await TestBed.configureTestingModule({
      declarations: [DoctorListComponent],
      providers: [
        { provide: DoctorService, useValue: doctorServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorListComponent);
    component = fixture.componentInstance;
  });

  it('should load doctors and summary on init', () => {
    fixture.detectChanges();

    expect(component.doctors.length).toBe(1);
    expect(component.summary.totalDoctors).toBe(1);
    expect(component.totalRecords).toBe(1);
  });

  it('should reset paging to page 1 when applying a search', () => {
    component.currentPage = 3;
    component.searchTerm = 'cardio';

    component.applySearch();

    expect(component.currentPage).toBe(1);
    expect(doctorServiceSpy.getDoctors).toHaveBeenCalledWith(jasmine.objectContaining({ searchTerm: 'cardio', page: 1 }));
  });

  it('should clear doctors on a failed load', () => {
    doctorServiceSpy.getDoctors.and.returnValue(throwError(() => new Error('network error')));

    component.loadDoctors();

    expect(component.doctors).toEqual([]);
    expect(component.totalRecords).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('should deactivate a doctor after confirmation and reload the list', () => {
    doctorServiceSpy.deactivateDoctor.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: undefined } as any));
    confirmationServiceSpy.confirm.and.callFake((options: any) => options.accept());

    component.deactivateDoctor(listResponse.content.doctors[0] as any, { target: null } as any);

    expect(doctorServiceSpy.deactivateDoctor).toHaveBeenCalledWith(1);
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });
});
