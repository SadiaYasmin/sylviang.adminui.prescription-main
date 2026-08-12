import { AllergyPresetId } from '@core/interfaces/patients/patient.interface';

// Sentinel used only in the manage-patient form's select — never sent to the backend.
// Picking it reveals a free-text input and the submit step maps it to
// { allergyPresetId: null, allergyOtherText: <free text> }.
export const OTHER_ALLERGY_OPTION = 'Other' as const;

export interface IAllergyPresetOption {
  label: string;
  value: AllergyPresetId;
}

export const AllergyPresetOptions: IAllergyPresetOption[] = [
  { label: 'None', value: 'None' },
  { label: 'Penicillin', value: 'Penicillin' },
  { label: 'Dust', value: 'Dust' },
  { label: 'Seafood', value: 'Seafood' },
  { label: 'Latex', value: 'Latex' },
];

// Same options plus the UI-only "Other" sentinel, for the select's [options] binding.
export const AllergySelectOptions: { label: string; value: AllergyPresetId | typeof OTHER_ALLERGY_OPTION }[] = [...AllergyPresetOptions, { label: 'Other', value: OTHER_ALLERGY_OPTION }];
