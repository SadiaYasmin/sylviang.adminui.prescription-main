import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { MedicineService } from '@core/services/medicines/medicine.service';
import { ToastService } from '@core/services/misc/toast.service';
import { of } from 'rxjs';
import { ManageMedicineComponent } from './manage-medicine.component';

describe('ManageMedicineComponent', () => {
  let component: ManageMedicineComponent;
  let fixture: ComponentFixture<ManageMedicineComponent>;
  let medicineServiceSpy: jasmine.SpyObj<MedicineService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const existingMedicineResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: { medicineId: 1, brandName: 'Napa', genericName: null, strength: '500mg', manufacturer: null, dosageForm: null, category: null, active: true, totalPrescribed: 0 },
  };

  function configure(id: string | null): void {
    medicineServiceSpy = jasmine.createSpyObj('MedicineService', ['getById', 'create', 'update']);
    medicineServiceSpy.getById.and.returnValue(of(existingMedicineResponse as any));
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const breadcrumbSpy = jasmine.createSpyObj('BreadcrumbService', ['setBreadcrumbs']);

    TestBed.configureTestingModule({
      declarations: [ManageMedicineComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: MedicineService, useValue: medicineServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: BreadcrumbService, useValue: breadcrumbSpy },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap(id ? { id } : {})) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageMedicineComponent);
    component = fixture.componentInstance;
  }

  it('should not call create and should mark fields touched when the form is invalid', () => {
    configure(null);
    fixture.detectChanges();

    component.onSubmit();

    expect(medicineServiceSpy.create).not.toHaveBeenCalled();
    expect(component.medicineForm.get('brandName')?.touched).toBeTrue();
  });

  it('should create a medicine when the form is valid in create mode', () => {
    configure(null);
    fixture.detectChanges();
    medicineServiceSpy.create.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: existingMedicineResponse.content } as any));
    component.medicineForm.patchValue({ brandName: 'Napa', strength: '500mg' });

    component.onSubmit();

    expect(medicineServiceSpy.create).toHaveBeenCalled();
    expect(toastServiceSpy.success).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/medicines/medicine-list']);
  });

  it('should load and patch the existing medicine in edit mode', () => {
    configure('1');
    fixture.detectChanges();

    expect(medicineServiceSpy.getById).toHaveBeenCalledWith(1);
    expect(component.medicineForm.get('brandName')?.value).toBe('Napa');
    expect(component.isEditMode).toBeTrue();
  });

  it('should update a medicine when the form is valid in edit mode', () => {
    configure('1');
    fixture.detectChanges();
    medicineServiceSpy.update.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: existingMedicineResponse.content } as any));

    component.onSubmit();

    expect(medicineServiceSpy.update).toHaveBeenCalledWith(1, jasmine.objectContaining({ brandName: 'Napa' }));
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });
});
