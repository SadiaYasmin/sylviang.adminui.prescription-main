import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PrescriptionService } from '@core/services/prescriptions/prescription.service';
import { IPrescriptionDocument } from '@core/interfaces/prescriptions/prescription.interface';

/**
 * US-035: public, no-login verification page — reads `?id=<DisplayCode>` and renders the
 * same read-only template component authoring/view use. Lives outside the authenticated
 * route tree entirely (see app.routes.ts) — no Shell chrome, no authGuard.
 */
@Component({
  selector: 'app-verify',
  standalone: false,
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss',
})
export class VerifyComponent implements OnInit {
  document: IPrescriptionDocument | null = null;
  loading = true;
  notFound = false;
  displayCode: string | null = null;

  constructor(private route: ActivatedRoute, private prescriptionService: PrescriptionService) {}

  ngOnInit(): void {
    this.displayCode = this.route.snapshot.queryParamMap.get('id');
    if (!this.displayCode) {
      this.loading = false;
      this.notFound = true;
      return;
    }

    this.prescriptionService.verify(this.displayCode).subscribe({
      next: (res) => {
        this.document = res.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
      },
    });
  }
}
