import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoctorPreferencesService } from '@core/services/doctor-preferences/doctor-preferences.service';
import { HospitalSettingsService } from '@core/services/hospital-settings/hospital-settings.service';
import { ToastService } from '@core/services/misc/toast.service';
import { TemplateService } from '@core/services/templates/template.service';
import { of, throwError } from 'rxjs';
import { PreferencesComponent } from './preferences.component';

describe('PreferencesComponent', () => {
  let component: PreferencesComponent;
  let fixture: ComponentFixture<PreferencesComponent>;
  let doctorPreferencesServiceSpy: jasmine.SpyObj<DoctorPreferencesService>;
  let templateServiceSpy: jasmine.SpyObj<TemplateService>;
  let hospitalSettingsServiceSpy: jasmine.SpyObj<HospitalSettingsService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const preferencesResponse = { hasError: false, decentMessage: 'ok', content: { preferredTemplateId: 1, signatureUrl: null, preferredLanguage: null } };
  const templateDetails = {
    templateId: 1,
    name: 'Classic',
    type: 'Classic',
    language: 'En',
    enabled: true,
    isSystemDefault: true,
    config: {} as any,
  };

  beforeEach(() => {
    doctorPreferencesServiceSpy = jasmine.createSpyObj('DoctorPreferencesService', ['get', 'update']);
    doctorPreferencesServiceSpy.get.and.returnValue(of(preferencesResponse as any));
    templateServiceSpy = jasmine.createSpyObj('TemplateService', ['getList', 'getById']);
    templateServiceSpy.getList.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { templates: [{ templateId: 1, name: 'Classic' }] } } as any));
    templateServiceSpy.getById.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: templateDetails } as any));
    hospitalSettingsServiceSpy = jasmine.createSpyObj('HospitalSettingsService', ['get']);
    hospitalSettingsServiceSpy.get.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: {} } as any));
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    TestBed.configureTestingModule({
      declarations: [PreferencesComponent],
      providers: [
        { provide: DoctorPreferencesService, useValue: doctorPreferencesServiceSpy },
        { provide: TemplateService, useValue: templateServiceSpy },
        { provide: HospitalSettingsService, useValue: hospitalSettingsServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PreferencesComponent);
    component = fixture.componentInstance;
  });

  it('should load preferences and templates (with full config for preview) on init', () => {
    fixture.detectChanges();

    expect(component.preferences?.preferredTemplateId).toBe(1);
    expect(templateServiceSpy.getById).toHaveBeenCalledWith(1);
    expect(component.templates.length).toBe(1);
    expect(component.templates[0].config).toBeDefined();
  });

  it('should select a template', () => {
    fixture.detectChanges();
    doctorPreferencesServiceSpy.update.and.returnValue(of(preferencesResponse as any));

    component.selectTemplate(2);

    expect(doctorPreferencesServiceSpy.update).toHaveBeenCalledWith({ preferredTemplateId: 2, preferredLanguage: null });
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });

  it('should stop loading even if the preferences call fails', () => {
    doctorPreferencesServiceSpy.get.and.returnValue(throwError(() => new Error('network error')));

    fixture.detectChanges();

    expect(component.loading).toBeFalse();
  });

  it('should map template language to the preview language code', () => {
    expect(component.langCode('Bn')).toBe('bn');
    expect(component.langCode('En')).toBe('en');
  });
});
