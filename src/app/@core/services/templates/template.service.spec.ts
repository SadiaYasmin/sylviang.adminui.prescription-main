import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL_Templates } from '@env/environment';
import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let service: TemplateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TemplateService],
    });
    service = TestBed.inject(TemplateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get the template list', () => {
    service.getList().subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Templates}`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: { templates: [] } });
  });

  it('should get a template by id', () => {
    service.getById(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Templates}/5`);
    expect(req.request.method).toBe('GET');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should post a create request', () => {
    const request = { name: 'Main OPD', type: 'Classic' as const, language: 'En' as const };
    service.create(request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Templates}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should put an update request', () => {
    const request = { name: 'Main OPD', config: {} as any };
    service.update(5, request).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Templates}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should post a duplicate request', () => {
    service.duplicate(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Templates}/5/duplicate`);
    expect(req.request.method).toBe('POST');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should patch a toggle-enabled request', () => {
    service.toggleEnabled(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Templates}/5/toggle-enabled`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });

  it('should delete a template', () => {
    service.delete(5).subscribe();

    const req = httpMock.expectOne(`${BASE_URL_Templates}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ hasError: false, decentMessage: 'ok', content: null });
  });
});
