import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_DoctorPreferences } from '@env/environment';
import { DoctorPreferencesService } from './doctor-preferences.service';

describe('DoctorPreferencesService', () => {
  let service: DoctorPreferencesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DoctorPreferencesService],
    });
    service = TestBed.inject(DoctorPreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get preferences', () => {
    service.get().subscribe();

    const req = httpMock.expectOne(BASE_URL_DoctorPreferences);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: {} });
  });

  it('should put to update preferences', () => {
    const request = { preferredTemplateId: 1, preferredLanguage: 'En' as const };
    service.update(request).subscribe();

    const req = httpMock.expectOne(BASE_URL_DoctorPreferences);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: {} });
  });

  it('should put to update the signature', () => {
    const request = { signatureBase64: 'data:image/png;base64,abc' };
    service.updateSignature(request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_DoctorPreferences}/signature`);
    expect(req.request.method).toBe('PUT');
    req.flush({ hasError: false, decentMessage: 'ok', content: {} });
  });
});
