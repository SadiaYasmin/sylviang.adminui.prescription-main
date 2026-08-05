import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_Staff } from '@env/environment';
import { StaffService } from './staff.service';

describe('StaffService', () => {
  let service: StaffService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StaffService],
    });
    service = TestBed.inject(StaffService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request the staff list with only the provided filters as query params', () => {
    service.getStaff({ page: 2, pageSize: 20, searchTerm: 'front', department: 'Front Desk', isActive: true }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === BASE_URL_Staff && r.params.get('page') === '2' && r.params.get('pageSize') === '20' && r.params.get('searchTerm') === 'front' && r.params.get('department') === 'Front Desk' && r.params.get('isActive') === 'true',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: { staff: [], totalCount: 0, pageNumber: 2, pageSize: 20 } });
  });

  it('should omit empty filters from the query params', () => {
    service.getStaff({}).subscribe();

    const req = httpMock.expectOne((r) => r.url === BASE_URL_Staff);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should request the assigned-to-me endpoint with an optional search term', () => {
    service.getAssignedToMe('front').subscribe();

    const req = httpMock.expectOne((r) => r.url === `${BASE_URL_Staff}/assigned-to-me` && r.params.get('searchTerm') === 'front');
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: { staff: [], totalCount: 0, pageNumber: 1, pageSize: 0 } });
  });

  it('should get staff by id', () => {
    service.getStaffById(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Staff}/5`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should post a create request', () => {
    const request = { username: 'new.staff', fullName: 'Jane Roy', phone: '01712345678', assignedDoctorIds: [] };
    service.addStaff(request).subscribe();

    const req = httpMock.expectOne(BASE_URL_Staff);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should put an update request', () => {
    const request = { fullName: 'Jane Roy', phone: '01712345678', assignedDoctorIds: [], isActive: true };
    service.updateStaff(5, request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Staff}/5`);
    expect(req.request.method).toBe('PUT');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should delete (deactivate) a staff member', () => {
    service.deactivateStaff(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Staff}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });
});
