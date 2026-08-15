import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DoctorPreferencesService } from '@core/services/doctor-preferences/doctor-preferences.service';
import { ToastService } from '@core/services/misc/toast.service';
import { SignatureProcessingService } from '@core/services/signature-processing/signature-processing.service';
import { TemplateService } from '@core/services/templates/template.service';
import { of, throwError } from 'rxjs';
import { PreferencesComponent } from './preferences.component';

describe('PreferencesComponent', () => {
  let component: PreferencesComponent;
  let fixture: ComponentFixture<PreferencesComponent>;
  let doctorPreferencesServiceSpy: jasmine.SpyObj<DoctorPreferencesService>;
  let signatureProcessingServiceSpy: jasmine.SpyObj<SignatureProcessingService>;
  let templateServiceSpy: jasmine.SpyObj<TemplateService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const preferencesResponse = { hasError: false, decentMessage: 'ok', content: { preferredTemplateId: 1, signatureUrl: null, preferredLanguage: null } };
  const profileResponse = {
    hasError: false,
    decentMessage: 'ok',
    content: { doctorId: 1, fullName: 'Dr. Jane', qualification: null, department: null, licenseNumber: null, phone: '01712345678', email: null, photoUrl: null },
  };

  beforeEach(() => {
    doctorPreferencesServiceSpy = jasmine.createSpyObj('DoctorPreferencesService', [
      'get',
      'update',
      'updateSignature',
      'getProfile',
      'updateProfile',
      'updatePhoto',
      'removePhoto',
    ]);
    doctorPreferencesServiceSpy.get.and.returnValue(of(preferencesResponse as any));
    doctorPreferencesServiceSpy.getProfile.and.returnValue(of(profileResponse as any));
    signatureProcessingServiceSpy = jasmine.createSpyObj('SignatureProcessingService', ['removeBackground', 'blobToDataUrl']);
    templateServiceSpy = jasmine.createSpyObj('TemplateService', ['getList']);
    templateServiceSpy.getList.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { templates: [{ templateId: 1, name: 'Classic' }] } } as any));
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    TestBed.configureTestingModule({
      declarations: [PreferencesComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: DoctorPreferencesService, useValue: doctorPreferencesServiceSpy },
        { provide: SignatureProcessingService, useValue: signatureProcessingServiceSpy },
        { provide: TemplateService, useValue: templateServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PreferencesComponent);
    component = fixture.componentInstance;
  });

  it('should load preferences, templates, and profile on init', () => {
    fixture.detectChanges();

    expect(component.preferences?.preferredTemplateId).toBe(1);
    expect(component.templates.length).toBe(1);
    expect(component.profile?.fullName).toBe('Dr. Jane');
    expect(component.profileForm.get('fullName')?.value).toBe('Dr. Jane');
  });

  it('should not call updateProfile and should mark fields touched when the profile form is invalid', () => {
    fixture.detectChanges();
    component.profileForm.patchValue({ fullName: '' });

    component.saveProfile();

    expect(doctorPreferencesServiceSpy.updateProfile).not.toHaveBeenCalled();
    expect(component.profileForm.get('fullName')?.touched).toBeTrue();
  });

  it('should save the profile when valid', () => {
    fixture.detectChanges();
    doctorPreferencesServiceSpy.updateProfile.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: profileResponse.content } as any));

    component.saveProfile();

    expect(doctorPreferencesServiceSpy.updateProfile).toHaveBeenCalled();
    expect(toastServiceSpy.success).toHaveBeenCalled();
  });

  it('should select a template', () => {
    fixture.detectChanges();
    doctorPreferencesServiceSpy.update.and.returnValue(of(preferencesResponse as any));

    component.selectTemplate(2);

    expect(doctorPreferencesServiceSpy.update).toHaveBeenCalledWith({ preferredTemplateId: 2, preferredLanguage: null });
  });

  it('should process a selected signature file and save it after successful background removal', async () => {
    fixture.detectChanges();
    const resultBlob = new Blob(['png'], { type: 'image/png' });
    signatureProcessingServiceSpy.removeBackground.and.resolveTo(resultBlob);
    signatureProcessingServiceSpy.blobToDataUrl.and.resolveTo('data:image/png;base64,xyz');
    doctorPreferencesServiceSpy.updateSignature.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { ...preferencesResponse.content, signatureUrl: 'data:image/png;base64,xyz' } } as any));

    const file = new File(['abc'], 'sig.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;
    await component.onSignatureSelected(event);

    expect(signatureProcessingServiceSpy.removeBackground).toHaveBeenCalledWith(file);
    expect(doctorPreferencesServiceSpy.updateSignature).toHaveBeenCalledWith({ signatureBase64: 'data:image/png;base64,xyz' });
    expect(component.signatureState).toBe('success');
    expect(component.signaturePreview).toBe('data:image/png;base64,xyz');
  });

  it('should reject a non-image file up front without calling the processing service', () => {
    fixture.detectChanges();
    const file = new File(['abc'], 'notes.txt', { type: 'text/plain' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    component.onSignatureSelected(event);

    expect(signatureProcessingServiceSpy.removeBackground).not.toHaveBeenCalled();
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });

  it('should enter error state on processing failure and allow retry without re-selecting the file', async () => {
    fixture.detectChanges();
    signatureProcessingServiceSpy.removeBackground.and.rejectWith(new Error('Could not process that signature image.'));

    const file = new File(['abc'], 'sig.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;
    await component.onSignatureSelected(event);

    expect(component.signatureState).toBe('error');

    // Retry re-runs processing on the SAME file without asking for a re-upload.
    signatureProcessingServiceSpy.removeBackground.calls.reset();
    signatureProcessingServiceSpy.removeBackground.and.resolveTo(new Blob(['png'], { type: 'image/png' }));
    signatureProcessingServiceSpy.blobToDataUrl.and.resolveTo('data:image/png;base64,xyz');
    doctorPreferencesServiceSpy.updateSignature.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: preferencesResponse.content } as any));

    await component.retrySignature();

    expect(signatureProcessingServiceSpy.removeBackground).toHaveBeenCalledWith(file);
    expect(component.signatureState).toBe('success');
  });

  it('should upload a photo', async () => {
    fixture.detectChanges();
    doctorPreferencesServiceSpy.updatePhoto.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { ...profileResponse.content, photoUrl: 'data:image/png;base64,xyz' } } as any));
    const file = new File(['abc'], 'photo.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;

    await component.onPhotoSelected(event);

    expect(doctorPreferencesServiceSpy.updatePhoto).toHaveBeenCalled();
    expect(component.profile?.photoUrl).toBe('data:image/png;base64,xyz');
  });

  it('should remove a photo', () => {
    fixture.detectChanges();
    doctorPreferencesServiceSpy.removePhoto.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { ...profileResponse.content, photoUrl: null } } as any));

    component.removePhoto();

    expect(doctorPreferencesServiceSpy.removePhoto).toHaveBeenCalled();
    expect(component.profile?.photoUrl).toBeNull();
  });

  it('should stop loading even if the preferences call fails', () => {
    doctorPreferencesServiceSpy.get.and.returnValue(throwError(() => new Error('network error')));

    fixture.detectChanges();

    expect(component.loading).toBeFalse();
  });
});
