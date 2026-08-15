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

/** SectionType is immutable on edit — see backend UpdateQuickAddPresetRequest for why. */
export interface IUpdateQuickAddPresetRequest {
  label: string;
  payloadJson: string;
}

export type IAdvicePhraseDictionary = Record<string, string>;
