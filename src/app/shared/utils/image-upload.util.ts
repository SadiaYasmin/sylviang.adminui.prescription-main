/**
 * Shared image-file validation + base64 read, extracted from what was three independent
 * copies of the same FileReader-based logic (preferences.component.ts, manage-doctor.component.ts,
 * hospital-settings.component.ts). Deliberately a plain utility, not a shared component — the
 * upload UI itself still differs enough per screen (photo vs. signature vs. logo) that a
 * shared component would be more machinery than the duplication it removes.
 */
export interface IImageValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateImageFile(file: File): IImageValidationResult {
  if (!file.type.startsWith('image/')) {
    return { ok: false, reason: 'Please choose an image file.' };
  }
  return { ok: true };
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
