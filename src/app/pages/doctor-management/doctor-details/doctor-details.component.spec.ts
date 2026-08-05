import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { DoctorService } from '@core/services/doctors/doctor.service';
import { ToastService } from '@core/services/misc/toast.service';
import { of, throwError } from 'rxjs';
import { DoctorDetailsComponent } from './doctor-details.component';

describe('DoctorDetailsComponent', () => {
  let component: DoctorDetailsComponent;
  let fixture: ComponentFixture<DoctorDetailsComponent>;
  let doctorServiceSpy: jasmine.SpyObj<DoctorService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function configure(id: string | null) {
    doctorServiceSpy = jasmine.createSpyObj('DoctorService', ['getDoctorById']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    TestBed.configureTestingModule({
      declarations: [DoctorDetailsComponent],
      providers: [
        { provide: DoctorService, useValue: doctorServiceSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorDetailsComponent);
    component = fixture.componentInstance;
  }

  it('should load and expose doctor details with zero-state performance stats', () => {
    configure('1');
    doctorServiceSpy.getDoctorById.and.returnValue(
      of({
        hasError: false,
        decentMessage: 'ok',
        content: {
          profile: { doctorId: 1, userId: 1, fullName: 'Dr. Jane Doe', username: 'jane', phone: '01712345678', isActive: true },
          performance: { totalPrescriptions: 0, topMedicines: [], recentPrescriptions: [], activityTrend: [] },
        },
      } as any),
    );

    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.details?.profile.fullName).toBe('Dr. Jane Doe');
    expect(component.details?.performance.topMedicines).toEqual([]);
  });

  it('should navigate back to the list when no id is present in the route', () => {
    configure(null);

    fixture.detectChanges();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/doctors/doctor-list']);
    expect(doctorServiceSpy.getDoctorById).not.toHaveBeenCalled();
  });

  it('should navigate back to the list when the load fails', () => {
    configure('999');
    doctorServiceSpy.getDoctorById.and.returnValue(throwError(() => new Error('not found')));

    fixture.detectChanges();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/doctors/doctor-list']);
  });
});
