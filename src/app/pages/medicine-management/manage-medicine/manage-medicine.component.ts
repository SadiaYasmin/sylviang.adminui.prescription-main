import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { MedicineService } from '@core/services/medicines/medicine.service';
import { ToastService } from '@core/services/misc/toast.service';

@Component({
  selector: 'app-manage-medicine',
  standalone: false,
  templateUrl: './manage-medicine.component.html',
  styleUrl: './manage-medicine.component.scss',
})
export class ManageMedicineComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private medicineService: MedicineService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private toast: ToastService,
  ) {}

  medicineForm!: FormGroup;
  formSubmitted = false;
  isEditMode = false;
  medicineId!: number;
  loading = false;
  saving = false;

  ngOnInit(): void {
    this.initForm();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.medicineId = +idParam;
        this.isEditMode = true;
        this.loadMedicine();
      }

      this.breadcrumbService.setBreadcrumbs([
        { title: 'Medicine Catalog', icon: 'fa-solid fa-pills', href: '/medicines/medicine-list' },
        { title: this.isEditMode ? 'Edit Medicine' : 'Add Medicine', icon: 'fa-solid fa-edit', href: '/medicines/manage-medicine' },
      ]);
    });
  }

  private initForm(): void {
    this.medicineForm = this.fb.group({
      brandName: [null, [Validators.required, Validators.maxLength(200)]],
      genericName: [null],
      strength: [null],
      manufacturer: [null],
      dosageForm: [null],
      route: [null],
      category: [null],
      unitPrice: [null],
      dgdaRegistered: [false],
    });
  }

  private loadMedicine(): void {
    this.loading = true;
    this.medicineService.getById(this.medicineId).subscribe({
      next: (response) => {
        if (response && !response.hasError && response.content) {
          this.medicineForm.patchValue(response.content);
        } else {
          this.toast.error({ detail: 'Could not load this medicine.' });
          this.router.navigate(['/medicines/medicine-list']);
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error({ detail: 'Could not load this medicine.' });
        this.router.navigate(['/medicines/medicine-list']);
        this.loading = false;
      },
    });
  }

  get f() {
    return this.medicineForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.medicineForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.medicineForm.invalid) {
      this.medicineForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const request = this.medicineForm.getRawValue();
    const action$ = this.isEditMode ? this.medicineService.update(this.medicineId, request) : this.medicineService.create(request);

    action$.subscribe({
      next: (response) => {
        this.saving = false;
        if (response && !response.hasError) {
          this.toast.success({ detail: `Medicine ${this.isEditMode ? 'updated' : 'created'} successfully.` });
          this.router.navigate(['/medicines/medicine-list']);
        } else if (!response?.decentMessage) {
          this.toast.error({ detail: `Could not ${this.isEditMode ? 'update' : 'create'} this medicine.` });
        }
      },
      error: () => {
        this.saving = false;
        // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/medicines/medicine-list']);
  }
}
