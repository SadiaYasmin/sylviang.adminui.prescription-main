import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_QuickAdd } from '@env/environment';
import { QuickAddService } from './quick-add.service';

describe('QuickAddService', () => {
  let service: QuickAddService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QuickAddService],
    });
    service = TestBed.inject(QuickAddService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get the list for a section type', () => {
    service.getList('Medicine').subscribe();

    const req = httpMock.expectOne((r) => r.url === BASE_URL_QuickAdd && r.params.get('sectionType') === 'Medicine');
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: [] });
  });

  it('should post to add a preset', () => {
    const request = { sectionType: 'Diagnosis' as const, label: 'URTI', payloadJson: '{}' };
    service.add(request).subscribe();

    const req = httpMock.expectOne(BASE_URL_QuickAdd);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: {} });
  });

  it('should delete a preset', () => {
    service.delete(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_QuickAdd}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });
});
