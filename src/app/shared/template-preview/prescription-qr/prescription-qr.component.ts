import { Component, Input, OnChanges } from '@angular/core';
import * as QRCode from 'qrcode';

/**
 * Renders a real scannable QR (US-035) when `qrValue` is set — points at the public
 * verification page (`/verify?id=<DisplayCode>`) for a finalized prescription. Falls back
 * to the original decorative, non-scannable placeholder pattern (Epic H's template preview,
 * and any authoring/draft view where there's no finalized id to encode yet).
 */
@Component({
  selector: 'app-prescription-qr',
  standalone: false,
  templateUrl: './prescription-qr.component.html',
  styleUrl: './prescription-qr.component.scss',
})
export class PrescriptionQrComponent implements OnChanges {
  @Input() ink = '#0f172a';
  @Input() size = 78;
  @Input() qrValue: string | null = null;

  dataUrl: string | null = null;

  ngOnChanges(): void {
    if (!this.qrValue) {
      this.dataUrl = null;
      return;
    }
    QRCode.toDataURL(this.qrValue, { width: this.size * 2, margin: 1, color: { dark: this.ink, light: '#ffffff' } })
      .then((url) => (this.dataUrl = url))
      .catch(() => (this.dataUrl = null));
  }
}
