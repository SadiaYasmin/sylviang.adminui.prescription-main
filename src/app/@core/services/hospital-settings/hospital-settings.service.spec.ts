import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_HospitalSettings } from '@env/environment';
import { IUpdateHospitalSettingsRequest } from '@core/interfaces/hospital-settings/hospital-settings.interface';
import { HospitalSettingsService } from './hospital-settings.service';

describe('HospitalSettingsService', () => {
  let service: HospitalSettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HospitalSettingsService],
    });
    service = TestBed.inject(HospitalSettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get the hospital settings', () => {
    service.get().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_HospitalSettings}`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should put an update request', () => {
    const request: IUpdateHospitalSettingsRequest = {
      name: 'City Hospital',
      logoBase64: null,
      address: '123 Main St',
      phone: '01712345678',
      emergencyNumber: '01799999999',
      email: 'info@example.com',
      website: 'https://example.com',
      slogan: 'Care first',
      sloganBn: 'যত্নই প্রথম',
      licenseNumber: 'LIC-001',
      sealBase64: null,
    };
    service.update(request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_HospitalSettings}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });
});
