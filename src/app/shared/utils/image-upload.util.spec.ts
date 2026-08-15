import { readImageAsDataUrl, validateImageFile } from './image-upload.util';

describe('image-upload.util', () => {
  describe('validateImageFile', () => {
    it('should accept an image file', () => {
      const file = new File(['abc'], 'signature.png', { type: 'image/png' });

      expect(validateImageFile(file)).toEqual({ ok: true });
    });

    it('should reject a non-image file', () => {
      const file = new File(['abc'], 'notes.txt', { type: 'text/plain' });

      const result = validateImageFile(file);

      expect(result.ok).toBeFalse();
      expect(result.reason).toBeTruthy();
    });
  });

  describe('readImageAsDataUrl', () => {
    it('should resolve with a data URL', async () => {
      const file = new File(['abc'], 'signature.png', { type: 'image/png' });

      const result = await readImageAsDataUrl(file);

      expect(result).toContain('data:image/png;base64,');
    });
  });
});
