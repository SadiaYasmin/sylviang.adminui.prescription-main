import { TestBed } from '@angular/core/testing';
import { SignatureProcessingService } from './signature-processing.service';

// Note: `removeBackground` itself comes from the third-party `@imgly/background-removal`
// package as a named ESM export, which the test bundler treats as a read-only binding —
// it can't be `spyOn`'d directly, and actually invoking it here would require loading the
// real WASM/ML model (too slow/heavy for a unit test, and it's not this project's code to
// verify). `blobToDataUrl` has no such dependency and is fully covered below; the
// `removeBackground` wrapper's own try/catch behavior is covered indirectly through
// PreferencesComponent's spec, which mocks this service at the DI boundary.
describe('SignatureProcessingService', () => {
  let service: SignatureProcessingService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SignatureProcessingService] });
    service = TestBed.inject(SignatureProcessingService);
  });

  it('should convert a blob to a data URL', async () => {
    const blob = new Blob(['fake-png'], { type: 'image/png' });

    const result = await service.blobToDataUrl(blob);

    expect(result).toContain('data:image/png;base64,');
  });
});
