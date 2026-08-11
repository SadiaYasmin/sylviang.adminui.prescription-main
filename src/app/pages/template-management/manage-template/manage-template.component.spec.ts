import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { LABELS_BN, LABELS_EN } from '@core/constants/prescription-labels';
import { ITemplateConfig, ITemplateDetails } from '@core/interfaces/templates/template.interface';
import { HospitalSettingsService } from '@core/services/hospital-settings/hospital-settings.service';
import { ToastService } from '@core/services/misc/toast.service';
import { TemplateService } from '@core/services/templates/template.service';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { of } from 'rxjs';
import { ManageTemplateComponent, labelsMatchLanguageDefaults, toLangCode } from './manage-template.component';

function buildConfig(labels: Record<string, string>): ITemplateConfig {
  return {
    header: { bgColor: '#ffffff', height: 80, logoSize: 40, nameFont: 'heading', borderStyle: 'solid' },
    footer: { bgColor: '#ffffff', height: 40, qrMessage: 'Scan to verify', qrMessageBn: 'যাচাই করতে স্ক্যান করুন', borderStyle: 'solid' },
    style: { sectionSpacing: 12, borderRadius: 4, borderStyle: 'solid', accentColor: '#2563eb', fontFamily: 'heading', fontSize: 14, tableStyle: 'plain', watermarkText: null },
    visibility: { logo: true, slogan: true, footer: true, watermark: false },
    print: { pageSize: 'A4', orientation: 'portrait', marginMm: 10 },
    labels,
  };
}

describe('labelsMatchLanguageDefaults (pure function)', () => {
  it('returns true when labels exactly equal the English defaults', () => {
    expect(labelsMatchLanguageDefaults(LABELS_EN, 'en')).toBeTrue();
  });

  it('returns true when labels exactly equal the Bangla defaults', () => {
    expect(labelsMatchLanguageDefaults(LABELS_BN, 'bn')).toBeTrue();
  });

  it('returns false when a single label has been customized', () => {
    const customized = { ...LABELS_EN, patientName: 'Full Name' };
    expect(labelsMatchLanguageDefaults(customized, 'en')).toBeFalse();
  });

  it('returns false when comparing English labels against Bangla defaults', () => {
    expect(labelsMatchLanguageDefaults(LABELS_EN, 'bn')).toBeFalse();
  });

  it('is not sensitive to key ordering (JSON deep-equality, not string equality)', () => {
    const reordered: Record<string, string> = {};
    Object.keys(LABELS_EN)
      .reverse()
      .forEach((key) => (reordered[key] = LABELS_EN[key]));
    expect(labelsMatchLanguageDefaults(reordered, 'en')).toBeTrue();
  });

  it('returns false for null/undefined labels', () => {
    expect(labelsMatchLanguageDefaults(null, 'en')).toBeFalse();
    expect(labelsMatchLanguageDefaults(undefined, 'en')).toBeFalse();
  });
});

describe('toLangCode', () => {
  it('maps En -> en and Bn -> bn', () => {
    expect(toLangCode('En')).toBe('en');
    expect(toLangCode('Bn')).toBe('bn');
  });
});

describe('ManageTemplateComponent', () => {
  let component: ManageTemplateComponent;
  let fixture: ComponentFixture<ManageTemplateComponent>;
  let templateServiceSpy: jasmine.SpyObj<TemplateService>;
  let hospitalSettingsServiceSpy: jasmine.SpyObj<HospitalSettingsService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function configure(id: string | null, template?: ITemplateDetails) {
    templateServiceSpy = jasmine.createSpyObj('TemplateService', ['getById', 'update', 'create']);
    if (template) {
      templateServiceSpy.getById.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: template } as any));
    }
    hospitalSettingsServiceSpy = jasmine.createSpyObj('HospitalSettingsService', ['get']);
    hospitalSettingsServiceSpy.get.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: null } as any));
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const breadcrumbSpy = jasmine.createSpyObj('BreadcrumbService', ['setBreadcrumbs']);

    TestBed.configureTestingModule({
      declarations: [ManageTemplateComponent],
      imports: [ReactiveFormsModule, FormsModule, SelectModule, InputNumberModule, ToggleSwitchModule, TabsModule],
      providers: [
        { provide: TemplateService, useValue: templateServiceSpy },
        { provide: HospitalSettingsService, useValue: hospitalSettingsServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: BreadcrumbService, useValue: breadcrumbSpy },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap(id ? { id } : {})) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageTemplateComponent);
    component = fixture.componentInstance;
  }

  it('should not call create and should mark fields touched when the create form is invalid', () => {
    configure(null);
    fixture.detectChanges();

    component.createTemplate();

    expect(component.createForm.invalid).toBeTrue();
    expect(templateServiceSpy.create).not.toHaveBeenCalled();
  });

  it('should load an existing template into the config form in edit mode', () => {
    const template: ITemplateDetails = { templateId: 1, name: 'Classic Default', type: 'Classic', language: 'En', enabled: true, isSystemDefault: true, config: buildConfig(LABELS_EN) };
    configure('1', template);
    fixture.detectChanges();

    expect(component.isEditMode).toBeTrue();
    expect(component.template?.name).toBe('Classic Default');
    expect(component.configForm.get('name')?.value).toBe('Classic Default');
    expect(component.labelsGroup.get('patientName')?.value).toBe('Name');
  });

  it('should show the government color-lock hint flag (isGovernment) only for Government-type templates', () => {
    const template: ITemplateDetails = { templateId: 3, name: 'Gov Layout', type: 'Government', language: 'En', enabled: true, isSystemDefault: false, config: buildConfig(LABELS_EN) };
    configure('3', template);
    fixture.detectChanges();

    expect(component.isGovernment).toBeTrue();

    const hint = fixture.nativeElement.querySelectorAll('.text-muted-color');
    const hintTexts = Array.from(hint).map((el: any) => el.textContent);
    expect(hintTexts.some((t: string) => t.includes('always monochrome'))).toBeTrue();
  });

  it('should not show the government color-lock hint for a Classic template', () => {
    const template: ITemplateDetails = { templateId: 1, name: 'Classic Default', type: 'Classic', language: 'En', enabled: true, isSystemDefault: true, config: buildConfig(LABELS_EN) };
    configure('1', template);
    fixture.detectChanges();

    expect(component.isGovernment).toBeFalse();
  });

  describe('changeLanguage (reset-vs-preserve logic)', () => {
    it('swaps labels to the new language defaults when the admin never customized them', () => {
      const template: ITemplateDetails = { templateId: 1, name: 'Classic Default', type: 'Classic', language: 'En', enabled: true, isSystemDefault: true, config: buildConfig(LABELS_EN) };
      configure('1', template);
      fixture.detectChanges();

      component.changeLanguage('Bn');

      expect(component.template?.language).toBe('Bn');
      expect(component.labelsGroup.get('patientName')?.value).toBe(LABELS_BN['patientName']);
      expect(component.labelsGroup.get('doctorSignature')?.value).toBe(LABELS_BN['doctorSignature']);
    });

    it('leaves customized labels untouched even though the language changes', () => {
      const customizedLabels = { ...LABELS_EN, patientName: 'Full Legal Name' };
      const template: ITemplateDetails = { templateId: 1, name: 'Classic Default', type: 'Classic', language: 'En', enabled: true, isSystemDefault: true, config: buildConfig(customizedLabels) };
      configure('1', template);
      fixture.detectChanges();

      component.changeLanguage('Bn');

      expect(component.template?.language).toBe('Bn');
      expect(component.labelsGroup.get('patientName')?.value).toBe('Full Legal Name');
      // Untouched labels (still on the old English default) are left as-is too — the
      // rule is all-or-nothing per the spec (only auto-swap if ALL labels still match).
      expect(component.labelsGroup.get('history')?.value).toBe(LABELS_EN['history']);
    });

    it('does nothing when the new language equals the current language', () => {
      const template: ITemplateDetails = { templateId: 1, name: 'Classic Default', type: 'Classic', language: 'En', enabled: true, isSystemDefault: true, config: buildConfig(LABELS_EN) };
      configure('1', template);
      fixture.detectChanges();

      component.changeLanguage('En');

      expect(component.configForm.dirty).toBeFalse();
    });
  });

  describe('resetLabelsToDefaults', () => {
    it('overwrites config.labels with the current language defaults unconditionally', () => {
      const customizedLabels = { ...LABELS_EN, patientName: 'Full Legal Name', history: 'Past Medical History' };
      const template: ITemplateDetails = { templateId: 1, name: 'Classic Default', type: 'Classic', language: 'En', enabled: true, isSystemDefault: true, config: buildConfig(customizedLabels) };
      configure('1', template);
      fixture.detectChanges();

      expect(component.labelsDrifted).toBeTrue();

      component.resetLabelsToDefaults();

      expect(component.labelsGroup.get('patientName')?.value).toBe(LABELS_EN['patientName']);
      expect(component.labelsGroup.get('history')?.value).toBe(LABELS_EN['history']);
      expect(component.labelsDrifted).toBeFalse();
    });
  });

  describe('previewConfig', () => {
    it('reflects the live (unsaved) form state', () => {
      const template: ITemplateDetails = { templateId: 1, name: 'Classic Default', type: 'Classic', language: 'En', enabled: true, isSystemDefault: true, config: buildConfig(LABELS_EN) };
      configure('1', template);
      fixture.detectChanges();

      (component.configForm.get('style') as any).get('fontSize').setValue(20);

      expect(component.previewConfig?.style.fontSize).toBe(20);
    });
  });

  it('should navigate to the newly created template on successful create', () => {
    configure(null);
    fixture.detectChanges();
    templateServiceSpy.create.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: { templateId: 9, name: 'New', type: 'Classic', language: 'En', enabled: true, isSystemDefault: false, config: buildConfig(LABELS_EN) } } as any),
    );

    component.createForm.setValue({ name: 'New Template', type: 'Classic', language: 'En' });
    component.createTemplate();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/templates/manage-template', 9]);
  });
});
