import { BloodGroup } from '@core/interfaces/patients/patient.interface';

export interface IBloodGroupOption {
  label: string;
  value: BloodGroup;
}

export const BloodGroupOptions: IBloodGroupOption[] = [
  { label: 'A+', value: 'APositive' },
  { label: 'A-', value: 'ANegative' },
  { label: 'B+', value: 'BPositive' },
  { label: 'B-', value: 'BNegative' },
  { label: 'AB+', value: 'ABPositive' },
  { label: 'AB-', value: 'ABNegative' },
  { label: 'O+', value: 'OPositive' },
  { label: 'O-', value: 'ONegative' },
];

export const BloodGroupLabels: Record<BloodGroup, string> = BloodGroupOptions.reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {} as Record<BloodGroup, string>,
);
