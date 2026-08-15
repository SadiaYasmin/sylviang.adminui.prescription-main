import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BreadcrumbService } from '@app/@core/services';
import { IHospitalSettings } from '@core/interfaces/hospital-settings/hospital-settings.interface';
import { HospitalSettingsService } from '@core/services/hospital-settings/hospital-settings.service';
import { ToastService } from '@core/services/misc/toast.service';
import { of } from 'rxjs';
import { HospitalSettingsComponent } from './hospital-settings.component';

describe('HospitalSettingsComponent', () => {
  let component: HospitalSettingsComponent;
  let fixture: ComponentFixture<HospitalSettingsComponent>;
  let hospitalSettingsServiceSpy: jasmine.SpyObj<HospitalSettingsService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const existingSettings: IHospitalSettings = {
    hospitalSettingsId: 1,
    name: 'City Hospital',
    logoUrl: null,
    address: '123 Main St',
    phone: '01712345678',
    emergencyNumber: '01799999999',
    email: 'info@example.com',
    website: 'https://example.com',
    slogan: 'Care first',
    sloganBn: 'যত্নই প্রথম',
    licenseNumber: 'LIC-001',
    sealUrl: null,
  };

  function configure(getResponse?: any) {
    hospitalSettingsServiceSpy = jasmine.createSpyObj('HospitalSettingsService', ['get', 'update']);
    hospitalSettingsServiceSpy.get.and.returnValue(of(getResponse ?? { hasError: false, decentMessage: 'ok', content: existingSettings }));
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    const breadcrumbSpy = jasmine.createSpyObj('BreadcrumbService', ['setBreadcrumbs']);

    TestBed.configureTestingModule({
      declarations: [HospitalSettingsComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: HospitalSettingsService, useValue: hospitalSettingsServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: BreadcrumbService, useValue: breadcrumbSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalSettingsComponent);
    component = fixture.componentInstance;
  }

  it('should load existing settings into the form', () => {
    configure();
    fixture.detectChanges();

    expect(hospitalSettingsServiceSpy.get).toHaveBeenCalled();
    expect(component.settingsForm.get('name')?.value).toBe('City Hospital');
    expect(component.settingsForm.get('sloganBn')?.value).toBe('যত্নই প্রথম');
  });

  it('should not call update and should mark fields touched when the form is invalid', () => {
    configure();
    fixture.detectChanges();
    component.settingsForm.patchValue({ name: null });

    component.onSubmit();

    expect(component.settingsForm.invalid).toBeTrue();
    expect(hospitalSettingsServiceSpy.update).not.toHaveBeenCalled();
  });

  it('should save updated settings', () => {
    configure();
    fixture.detectChanges();
    hospitalSettingsServiceSpy.update.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: existingSettings } as any));

    component.onSubmit();

    expect(hospitalSettingsServiceSpy.update).toHaveBeenCalled();
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });

  it('should clear the logo when removeLogo is called', () => {
    configure();
    fixture.detectChanges();
    component.settingsForm.patchValue({ logoBase64: 'data:image/png;base64,xyz' });
    component.currentLogoUrl = 'data:image/png;base64,xyz';

    component.removeLogo();

    // '' (not null) is the explicit "remove" signal — null means "leave unchanged".
    expect(component.settingsForm.get('logoBase64')?.value).toBe('');
    expect(component.currentLogoUrl).toBeNull();
  });
});
