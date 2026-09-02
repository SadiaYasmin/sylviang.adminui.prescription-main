import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { PrescriptionService } from '@core/services/prescriptions/prescription.service';
import { IPrescriptionDocument } from '@core/interfaces/prescriptions/prescription.interface';
import { downloadPrescriptionPdf } from '../pdf/prescription-pdf.util';

/** US-031: read-only rendering of any single prescription, for review/audit. */
@Component({
  selector: 'app-prescription-view',
  standalone: false,
  templateUrl: './prescription-view.component.html',
  styleUrl: './prescription-view.component.scss',
})
export class PrescriptionViewComponent implements OnInit {
  document: IPrescriptionDocument | null = null;
  loading = true;
  downloading = false;

  constructor(private route: ActivatedRoute, private prescriptionService: PrescriptionService, private breadcrumbService: BreadcrumbService) {}

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { title: 'Prescriptions', icon: 'fa-solid fa-file-prescription', href: '/prescriptions' },
      { title: 'Finalized Prescriptions', icon: 'fa-solid fa-file-circle-check', href: '/prescriptions/finalized' },
      { title: 'Prescription Details', icon: 'fa-solid fa-eye', href: `/prescriptions/view/${this.route.snapshot.paramMap.get('id')}` },
    ]);

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.prescriptionService.getById(id).subscribe({
      next: (res) => {
        this.document = res.content;
        this.loading = false;
        const action = this.route.snapshot.queryParamMap.get('action');
        if (action === 'print') {
          setTimeout(() => window.print(), 300);
        } else if (action === 'download') {
          setTimeout(() => this.download(), 300);
        }
      },
      error: () => (this.loading = false),
    });
  }

  print(): void {
    window.print();
  }

  async download(): Promise<void> {
    if (!this.document || this.downloading) return;
    this.downloading = true;
    try {
      await downloadPrescriptionPdf(this.document);
    } finally {
      this.downloading = false;
    }
  }
}
