import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@core/services/auth/auth.service';
import { MedicineService } from '@core/services/medicines/medicine.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { MedicineListComponent } from './medicine-list.component';

describe('MedicineListComponent', () => {
  let component: MedicineListComponent;
  let fixture: ComponentFixture<MedicineListComponent>;
  let medicineServiceSpy: jasmine.SpyObj<MedicineService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let confirmationServiceSpy: jasmine.SpyObj<ConfirmationService>;

  const summaryResponse = { hasError: false, decentMessage: 'ok', content: [{ medicineId: 1, brandName: 'Napa', genericName: null, strength: '500mg', dosageForm: null, category: null }] };
  const catalogResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: [{ medicineId: 1, brandName: 'Napa', genericName: null, strength: '500mg', manufacturer: null, dosageForm: null, category: null, active: true, totalPrescribed: 5 }],
  };

  function setup(role: string): void {
    medicineServiceSpy = jasmine.createSpyObj('MedicineService', ['search', 'getCatalog', 'deactivate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    authServiceSpy.getRole.and.returnValue(role);
    medicineServiceSpy.search.and.returnValue(of(summaryResponse as any));
    medicineServiceSpy.getCatalog.and.returnValue(of(catalogResponse as any));

    TestBed.configureTestingModule({
      declarations: [MedicineListComponent],
      providers: [
        { provide: MedicineService, useValue: medicineServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicineListComponent);
    component = fixture.componentInstance;
  }

  it('as Staff, should call the plain search endpoint, never the catalog/analytics one', () => {
    setup('Staff');

    fixture.detectChanges();

    expect(medicineServiceSpy.search).toHaveBeenCalled();
    expect(medicineServiceSpy.getCatalog).not.toHaveBeenCalled();
    expect(component.showAnalytics).toBeFalse();
    expect(component.canManage).toBeFalse();
    expect(component.medicines.length).toBe(1);
  });

  it('as Doctor, should call the catalog endpoint and expose analytics but not manage rights', () => {
    setup('Doctor');

    fixture.detectChanges();

    expect(medicineServiceSpy.getCatalog).toHaveBeenCalled();
    expect(medicineServiceSpy.search).not.toHaveBeenCalled();
    expect(component.showAnalytics).toBeTrue();
    expect(component.canManage).toBeFalse();
  });

  it('as Admin, should call the catalog endpoint and expose manage rights', () => {
    setup('Admin');

    fixture.detectChanges();

    expect(medicineServiceSpy.getCatalog).toHaveBeenCalled();
    expect(component.showAnalytics).toBeTrue();
    expect(component.canManage).toBeTrue();
  });

  it('should clear medicines on a failed load', () => {
    setup('Admin');
    medicineServiceSpy.getCatalog.and.returnValue(throwError(() => new Error('network error')));

    component.loadMedicines();

    expect(component.medicines).toEqual([]);
    expect(component.loading).toBeFalse();
  });

  it('should deactivate a medicine after confirmation and reload the list', () => {
    setup('Admin');
    medicineServiceSpy.deactivate.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));
    confirmationServiceSpy.confirm.and.callFake((options: any) => options.accept());

    component.deactivateMedicine(catalogResponse.content[0] as any, { target: null } as any);

    expect(medicineServiceSpy.deactivate).toHaveBeenCalledWith(1);
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });
});
