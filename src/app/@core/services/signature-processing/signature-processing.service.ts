import { Injectable } from '@angular/core';
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
  async removeBackground(file: File): Promise<Blob> {
    try {
      return await removeBackground(file);
    } catch {
      throw new Error('Could not process that signature image. Please try a clearer photo.');
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
