export type QuickAddSectionType = 'Medicine' | 'Diagnosis' | 'Investigation' | 'Advice' | 'FollowUp';

export interface IQuickAddPreset {
  quickAddPresetId: number;
  sectionType: QuickAddSectionType;
  label: string;
  payloadJson: string;
}

export interface IAddQuickAddPresetRequest {
  sectionType: QuickAddSectionType;
  label: string;
  payloadJson: string;
}
