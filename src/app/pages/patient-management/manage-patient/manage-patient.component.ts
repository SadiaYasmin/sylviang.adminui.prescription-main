import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AllergySelectOptions, OTHER_ALLERGY_OPTION } from '@app/@core/constants/allergy-presets';
import { ALLERGY_OTHER_SUGGESTIONS } from '@app/@core/constants/allergy-other-suggestions';
import { BloodGroupOptions } from '@app/@core/constants/blood-group-options';
import { BreadcrumbService } from '@app/@core/services';
import { AllergyPresetId, PatientGender } from '@core/interfaces/patients/patient.interface';
import { PatientService } from '@core/services/patients/patient.service';
import { ToastService } from '@core/services/misc/toast.service';

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

const GenderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
];

@Component({
  selector: 'app-manage-patient',
  standalone: false,
  templateUrl: './manage-patient.component.html',
  styleUrl: './manage-patient.component.scss',
})
export class ManagePatientComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private toast: ToastService,
  ) {}

  patientForm!: FormGroup;
  formSubmitted = false;
  isEditMode = false;
  patientId!: number;

  genderOptions = GenderOptions;
  bloodGroupOptions = BloodGroupOptions;
  allergySelectOptions = AllergySelectOptions;
  readonly otherAllergyOption = OTHER_ALLERGY_OPTION;
  readonly allergyOtherSuggestions = ALLERGY_OTHER_SUGGESTIONS;

  ngOnInit(): void {
    this.initForm();
    this.setupDobAgeToggle();
    this.setupAllergyToggle();

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.patientId = +idParam;
        this.isEditMode = true;

        this.patientService.getPatientById(this.patientId).subscribe({
          next: (response) => {
            if (response && !response.hasError && response.content) {
              const profile = response.content.profile;
              const allergyOption = !profile.allergyPresetId && profile.allergyOtherText ? this.otherAllergyOption : profile.allergyPresetId || 'None';
              this.patientForm.patchValue({
                name: profile.name,
                phone: profile.phone,
                dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.substring(0, 10) : null,
                age: profile.age,
                gender: profile.gender,
                address: profile.address,
                bloodGroup: profile.bloodGroup,
                allergyOption,
                allergyOtherText: profile.allergyOtherText,
              });
            } else {
              this.toast.error({ detail: 'Could not load this patient.' });
              this.router.navigate(['/patients/patient-list']);
            }
          },
          error: () => {
            this.toast.error({ detail: 'Could not load this patient.' });
            this.router.navigate(['/patients/patient-list']);
          },
        });
      }
    });

    this.breadcrumbService.setBreadcrumbs([
      { title: 'Patient Management', icon: 'fa-solid fa-user-injured', href: '/patients/patient-list' },
      { title: this.isEditMode ? 'Edit Patient' : 'Register Patient', icon: 'fa-solid fa-edit', href: '/patients/manage-patient' },
    ]);
  }

  private initForm(): void {
    this.patientForm = this.fb.group({
      name: [null, [Validators.required, Validators.maxLength(200)]],
      phone: [null, [Validators.required, Validators.pattern(BD_PHONE_REGEX)]],
      dateOfBirth: [null],
      age: [null, [Validators.required, Validators.min(0)]],
      gender: [null],
      address: [null],
      bloodGroup: [null],
      allergyOption: ['None'],
      allergyOtherText: [null],
    });
  }

  // Age is only meaningful when DOB is unknown — the backend requires it in that
  // case and ignores it otherwise, so mirror that as disable/enable + required toggling.
  private setupDobAgeToggle(): void {
    const ageControl = this.patientForm.get('age');
    this.patientForm.get('dateOfBirth')?.valueChanges.subscribe((value) => {
      if (value) {
        ageControl?.disable();
        ageControl?.clearValidators();
      } else {
        ageControl?.enable();
        ageControl?.setValidators([Validators.required, Validators.min(0)]);
      }
      ageControl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  // "Other" has no enum value on the wire — picking it reveals a free-text input
  // that becomes allergyOtherText while allergyPresetId is sent as null.
  private setupAllergyToggle(): void {
    const otherTextControl = this.patientForm.get('allergyOtherText');
    this.patientForm.get('allergyOption')?.valueChanges.subscribe((value) => {
      if (value === this.otherAllergyOption) {
        otherTextControl?.setValidators([Validators.required]);
      } else {
        otherTextControl?.clearValidators();
        otherTextControl?.setValue(null, { emitEvent: false });
      }
      otherTextControl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  get f() {
    return this.patientForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.patientForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  get isOtherAllergySelected(): boolean {
    return this.patientForm.get('allergyOption')?.value === this.otherAllergyOption;
  }

  // p-datepicker emits a local Date; JSON.stringify on a Date serializes to a UTC ISO
  // datetime string, which the backend's DateOnly? binder rejects. Format locally instead.
  private toDateOnlyString(value: unknown): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(value).slice(0, 10);
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    const formValue = this.patientForm.getRawValue();
    const dateOfBirth = this.toDateOnlyString(formValue.dateOfBirth);
    const isOther = formValue.allergyOption === this.otherAllergyOption;

    const request = {
      name: formValue.name,
      phone: formValue.phone,
      dateOfBirth,
      age: dateOfBirth ? null : formValue.age,
      gender: (formValue.gender as PatientGender) || null,
      address: formValue.address || null,
      bloodGroup: formValue.bloodGroup || null,
      allergyPresetId: isOther ? null : ((formValue.allergyOption as AllergyPresetId) || 'None'),
      allergyOtherText: isOther ? formValue.allergyOtherText : null,
    };

    if (this.isEditMode) {
      this.patientService.updatePatient(this.patientId, request).subscribe({
        next: (response) => {
          if (response && !response.hasError) {
            this.toast.success({ detail: 'Patient updated successfully.' });
            this.router.navigate(['/patients/patient-list']);
          } else if (!response?.decentMessage) {
            this.toast.error({ detail: 'Could not update this patient.' });
          }
        },
        error: () => {
          // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
        },
      });
    } else {
      this.patientService.createPatient(request).subscribe({
        next: (response) => {
          if (response && !response.hasError) {
            this.toast.success({ detail: 'Patient registered successfully.' });
            this.router.navigate(['/patients/patient-list']);
          } else if (!response?.decentMessage) {
            this.toast.error({ detail: 'Could not register this patient.' });
          }
        },
        error: () => {
          // ErrorHandlerInterceptor already surfaces the backend's error message as a toast.
        },
      });
    }
  }
}
