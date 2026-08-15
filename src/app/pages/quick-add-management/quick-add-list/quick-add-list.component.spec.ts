import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ToastService } from '@core/services/misc/toast.service';
import { QuickAddService } from '@core/services/quick-add/quick-add.service';
import { ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { QuickAddListComponent } from './quick-add-list.component';

describe('QuickAddListComponent', () => {
  let component: QuickAddListComponent;
  let fixture: ComponentFixture<QuickAddListComponent>;
  let quickAddServiceSpy: jasmine.SpyObj<QuickAddService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let confirmationServiceSpy: jasmine.SpyObj<ConfirmationService>;

  const medicinePreset = { quickAddPresetId: 1, sectionType: 'Medicine' as const, label: 'Napa 500', payloadJson: '{"medicine":"Napa","strength":"500mg","dosage":"1 tablet"}' };

  function configure(section: string): void {
    quickAddServiceSpy = jasmine.createSpyObj('QuickAddService', ['getList', 'delete']);
    quickAddServiceSpy.getList.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: [medicinePreset] } as any));
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);

    TestBed.configureTestingModule({
      declarations: [QuickAddListComponent],
      providers: [
        { provide: QuickAddService, useValue: quickAddServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ section })) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickAddListComponent);
    component = fixture.componentInstance;
  }

  it('should resolve the section from the route and load its presets', () => {
    configure('medicine');
    fixture.detectChanges();

    expect(component.section.sectionType).toBe('Medicine');
    expect(quickAddServiceSpy.getList).toHaveBeenCalledWith('Medicine');
    expect(component.presets.length).toBe(1);
  });

  it('should resolve a different section from a different route segment', () => {
    configure('follow-up');
    fixture.detectChanges();

    expect(component.section.sectionType).toBe('FollowUp');
    expect(quickAddServiceSpy.getList).toHaveBeenCalledWith('FollowUp');
  });

  it('should clear presets on a failed load', () => {
    configure('medicine');
    quickAddServiceSpy.getList.and.returnValue(throwError(() => new Error('network error')));

    fixture.detectChanges();

    expect(component.presets).toEqual([]);
    expect(component.loading).toBeFalse();
  });

  it('should preview a medicine payload as a readable summary', () => {
    configure('medicine');
    fixture.detectChanges();

    expect(component.previewPayload(medicinePreset as any)).toBe('Napa · 500mg · 1 tablet');
  });

  it('should preview a bilingual payload as English / Bangla', () => {
    configure('advice');
    const advicePreset = { quickAddPresetId: 2, sectionType: 'Advice' as const, label: 'Fluids', payloadJson: '{"en":"Drink water.","bn":"পানি পান করুন।"}' };
    fixture.detectChanges();

    expect(component.previewPayload(advicePreset as any)).toBe('Drink water. / পানি পান করুন।');
  });

  it('should delete a preset after confirmation and reload the list', () => {
    configure('medicine');
    fixture.detectChanges();
    quickAddServiceSpy.delete.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));
    confirmationServiceSpy.confirm.and.callFake((options: any) => options.accept());

    component.deletePreset(medicinePreset as any, { target: null } as any);

    expect(quickAddServiceSpy.delete).toHaveBeenCalledWith(1);
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });
});
