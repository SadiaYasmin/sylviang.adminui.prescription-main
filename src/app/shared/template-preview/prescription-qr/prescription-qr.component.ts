import { Component, Input } from '@angular/core';

/**
 * Decorative, self-contained QR-style graphic for the template preview's "scan to verify"
 * block. It is intentionally a fixed pattern (not a scannable code) — the real verification
 * QR is generated per-prescription at print time (Epic E); here it only communicates layout
 * and branding. `ink` lets the Government (monochrome) variant force pure black.
 */
@Component({
  selector: 'app-prescription-qr',
  standalone: false,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="Verification QR code">
      <rect width="100" height="100" fill="#fff" />
      <g [attr.fill]="ink">
        <rect x="0" y="0" width="28" height="28" />
        <rect x="72" y="0" width="28" height="28" />
        <rect x="0" y="72" width="28" height="28" />
      </g>
      <g fill="#fff">
        <rect x="4" y="4" width="20" height="20" />
        <rect x="76" y="4" width="20" height="20" />
        <rect x="4" y="76" width="20" height="20" />
      </g>
      <g [attr.fill]="ink">
        <rect x="8" y="8" width="12" height="12" />
        <rect x="80" y="8" width="12" height="12" />
        <rect x="8" y="80" width="12" height="12" />
        <rect x="36" y="4" width="4" height="4" /><rect x="44" y="4" width="4" height="4" /><rect x="52" y="8" width="4" height="4" /><rect x="60" y="4" width="4" height="4" />
        <rect x="36" y="12" width="4" height="4" /><rect x="48" y="12" width="4" height="4" /><rect x="60" y="12" width="4" height="4" />
        <rect x="40" y="20" width="4" height="4" /><rect x="52" y="20" width="4" height="4" /><rect x="4" y="36" width="4" height="4" /><rect x="12" y="36" width="4" height="4" />
        <rect x="24" y="36" width="4" height="4" /><rect x="36" y="36" width="4" height="4" /><rect x="44" y="40" width="4" height="4" /><rect x="56" y="36" width="4" height="4" />
        <rect x="68" y="36" width="4" height="4" /><rect x="80" y="36" width="4" height="4" /><rect x="92" y="36" width="4" height="4" />
        <rect x="8" y="44" width="4" height="4" /><rect x="20" y="44" width="4" height="4" /><rect x="32" y="44" width="4" height="4" /><rect x="48" y="48" width="4" height="4" />
        <rect x="64" y="44" width="4" height="4" /><rect x="76" y="48" width="4" height="4" /><rect x="88" y="44" width="4" height="4" />
        <rect x="36" y="52" width="4" height="4" /><rect x="52" y="56" width="4" height="4" /><rect x="4" y="52" width="4" height="4" /><rect x="16" y="56" width="4" height="4" />
        <rect x="68" y="56" width="4" height="4" /><rect x="84" y="56" width="4" height="4" /><rect x="40" y="60" width="4" height="4" /><rect x="56" y="64" width="4" height="4" />
        <rect x="72" y="64" width="4" height="4" /><rect x="88" y="64" width="4" height="4" /><rect x="36" y="68" width="4" height="4" /><rect x="48" y="68" width="4" height="4" />
        <rect x="60" y="72" width="4" height="4" /><rect x="72" y="76" width="4" height="4" /><rect x="84" y="72" width="4" height="4" /><rect x="92" y="80" width="4" height="4" />
        <rect x="36" y="80" width="4" height="4" /><rect x="48" y="84" width="4" height="4" /><rect x="60" y="88" width="4" height="4" /><rect x="72" y="88" width="4" height="4" />
        <rect x="40" y="92" width="4" height="4" /><rect x="52" y="92" width="4" height="4" /><rect x="84" y="92" width="4" height="4" />
      </g>
    </svg>
  `,
})
export class PrescriptionQrComponent {
  @Input() ink = '#0f172a';
  @Input() size = 78;
}
