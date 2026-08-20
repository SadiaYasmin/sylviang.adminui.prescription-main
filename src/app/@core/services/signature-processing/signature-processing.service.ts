import { Injectable, NgZone } from '@angular/core';
import { removeBackground } from '@imgly/background-removal';

/**
 * US-063: client-side signature background removal (in-browser WASM/ML model, no server
 * infra — matches the reference prototype and feature.md's own suggested default). Wraps
 * `@imgly/background-removal` behind this project's own service boundary so the manage
 * form doesn't import a third-party API directly, and so a failure surfaces as one typed
 * error the component can show a clear reason + retry for.
 */
@Injectable({
  providedIn: 'root',
})
export class SignatureProcessingService {
  constructor(private ngZone: NgZone) {}

  async removeBackground(file: File): Promise<Blob> {
    try {
      // Runs outside Angular's zone: zone.js monkey-patches fetch/Promise/WebAssembly,
      // which fights this library's own WASM-streaming model download + inference (its
      // internal progress callbacks would also otherwise trigger a change-detection run
      // on every downloaded chunk). Matches the reference prototype's plain (unpatched)
      // browser behavior, where this same call works.
      return await this.ngZone.runOutsideAngular(() => removeBackground(file));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Signature background removal failed:', err);
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`Could not process that signature image (${reason}). Please try a clearer photo.`);
    }
  }

  blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}
