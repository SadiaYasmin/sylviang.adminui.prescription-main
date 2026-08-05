import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_Doctors } from '@env/environment';
import { DoctorService } from './doctor.service';

describe('DoctorService', () => {
  let service: DoctorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DoctorService],
    });
    service = TestBed.inject(DoctorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request the doctor list with only the provided filters as query params', () => {
    service.getDoctors({ page: 2, pageSize: 20, searchTerm: 'cardio', department: 'Cardiology', isActive: true }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === BASE_URL_Doctors && r.params.get('page') === '2' && r.params.get('pageSize') === '20' && r.params.get('searchTerm') === 'cardio' && r.params.get('department') === 'Cardiology' && r.params.get('isActive') === 'true',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: { doctors: [], totalCount: 0, pageNumber: 2, pageSize: 20, summary: { totalDoctors: 0, activeDoctors: 0, totalPrescriptions: 0, totalMedicineEntries: 0 } } });
  });

  it('should omit empty filters from the query params', () => {
    service.getDoctors({}).subscribe();

    const req = httpMock.expectOne((r) => r.url === BASE_URL_Doctors);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should get a doctor by id', () => {
    service.getDoctorById(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Doctors}/5`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should post a create request', () => {
    const request = { username: 'new.doctor', fullName: 'Dr. Jane Doe', phone: '01712345678' };
    service.addDoctor(request).subscribe();

    const req = httpMock.expectOne(BASE_URL_Doctors);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should put an update request', () => {
    const request = { fullName: 'Dr. Jane Doe', phone: '01712345678', isActive: true };
    service.updateDoctor(5, request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Doctors}/5`);
    expect(req.request.method).toBe('PUT');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should delete (deactivate) a doctor', () => {
    service.deactivateDoctor(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Doctors}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });
});
