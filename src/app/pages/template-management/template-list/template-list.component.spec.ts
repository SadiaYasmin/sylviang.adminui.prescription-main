import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HospitalSettingsService } from '@core/services/hospital-settings/hospital-settings.service';
import { ToastService } from '@core/services/misc/toast.service';
import { TemplateService } from '@core/services/templates/template.service';
import { ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { TemplateListComponent } from './template-list.component';

describe('TemplateListComponent', () => {
  let component: TemplateListComponent;
  let fixture: ComponentFixture<TemplateListComponent>;
  let templateServiceSpy: jasmine.SpyObj<TemplateService>;
  let hospitalSettingsServiceSpy: jasmine.SpyObj<HospitalSettingsService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let confirmationServiceSpy: jasmine.SpyObj<ConfirmationService>;

  const summaryDefault = { templateId: 1, name: 'Classic Default', type: 'Classic' as const, language: 'En' as const, enabled: true, isSystemDefault: true };
  const summaryCustom = { templateId: 2, name: 'Corporate Blue', type: 'Corporate' as const, language: 'En' as const, enabled: true, isSystemDefault: false };
  const detailsDefault = { ...summaryDefault, config: {} as any };
  const detailsCustom = { ...summaryCustom, config: {} as any };

  beforeEach(() => {
    templateServiceSpy = jasmine.createSpyObj('TemplateService', ['getList', 'getById', 'duplicate', 'toggleEnabled', 'delete']);
    hospitalSettingsServiceSpy = jasmine.createSpyObj('HospitalSettingsService', ['get']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);

    hospitalSettingsServiceSpy.get.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));
    templateServiceSpy.getList.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { templates: [summaryDefault, summaryCustom] } } as any));
    templateServiceSpy.getById.and.callFake((id: number) =>
      of({ hasError: false, decentMessage: 'ok', content: id === 1 ? detailsDefault : detailsCustom } as any),
    );

    TestBed.configureTestingModule({
      declarations: [TemplateListComponent],
      providers: [
        { provide: TemplateService, useValue: templateServiceSpy },
        { provide: HospitalSettingsService, useValue: hospitalSettingsServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateListComponent);
    component = fixture.componentInstance;
  });

  it('should load the template list and hydrate each summary with full config via getById', () => {
    fixture.detectChanges();

    expect(templateServiceSpy.getList).toHaveBeenCalled();
    expect(templateServiceSpy.getById).toHaveBeenCalledWith(1);
    expect(templateServiceSpy.getById).toHaveBeenCalledWith(2);
    expect(component.templates.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should not call toggleEnabled for an enabled system-default template', () => {
    fixture.detectChanges();
    component.toggleEnabled(detailsDefault as any, { target: null } as any);

    expect(confirmationServiceSpy.confirm).not.toHaveBeenCalled();
    expect(templateServiceSpy.toggleEnabled).not.toHaveBeenCalled();
  });

  it('should not call delete for a system-default template', () => {
    fixture.detectChanges();
    component.deleteTemplate(detailsDefault as any, { target: null } as any);

    expect(confirmationServiceSpy.confirm).not.toHaveBeenCalled();
    expect(templateServiceSpy.delete).not.toHaveBeenCalled();
  });

  it('should confirm and call delete for a non-default template', () => {
    fixture.detectChanges();
    confirmationServiceSpy.confirm.and.callFake((options: any) => options.accept());
    templateServiceSpy.delete.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));

    component.deleteTemplate(detailsCustom as any, { target: null } as any);

    expect(confirmationServiceSpy.confirm).toHaveBeenCalled();
    expect(templateServiceSpy.delete).toHaveBeenCalledWith(2);
  });

  it('should call duplicate for any template, including the system default', () => {
    fixture.detectChanges();
    templateServiceSpy.duplicate.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));

    component.duplicateTemplate(detailsDefault as any);

    expect(templateServiceSpy.duplicate).toHaveBeenCalledWith(1);
  });
});
