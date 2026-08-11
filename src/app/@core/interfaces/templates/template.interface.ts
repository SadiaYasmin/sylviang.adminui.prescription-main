export type TemplateType = 'Classic' | 'Corporate' | 'Government';
export type TemplateLanguage = 'En' | 'Bn';
export type BorderStyle = 'none' | 'solid' | 'dashed';
export type FontChoice = 'heading' | 'body' | 'bangla';
export type TableStyle = 'plain' | 'striped' | 'bordered';

export interface ITemplateHeaderConfig {
  bgColor: string | null;
  height: number;
  logoSize: number;
  nameFont: 'heading' | 'body';
  borderStyle: BorderStyle;
}

export interface ITemplateFooterConfig {
  bgColor: string | null;
  height: number;
  qrMessage: string;
  qrMessageBn: string;
  borderStyle: BorderStyle;
}

export interface ITemplateStyleConfig {
  sectionSpacing: number;
  borderRadius: number;
  borderStyle: BorderStyle;
  accentColor: string | null;
  fontFamily: FontChoice;
  fontSize: number;
  tableStyle: TableStyle;
  watermarkText: string | null;
}

export interface ITemplateVisibilityConfig {
  logo: boolean;
  slogan: boolean;
  footer: boolean;
  watermark: boolean;
}

export interface ITemplatePrintConfig {
  pageSize: string;
  orientation: 'portrait' | 'landscape';
  marginMm: number;
}

export interface ITemplateConfig {
  header: ITemplateHeaderConfig;
  footer: ITemplateFooterConfig;
  style: ITemplateStyleConfig;
  visibility: ITemplateVisibilityConfig;
  print: ITemplatePrintConfig;
  labels: Record<string, string>;
}

export interface ITemplateSummary {
  templateId: number;
  name: string;
  type: TemplateType;
  language: TemplateLanguage;
  enabled: boolean;
  isSystemDefault: boolean;
}

export interface ITemplateDetails extends ITemplateSummary {
  config: ITemplateConfig;
}

export interface ICreateTemplateRequest {
  name: string;
  type: TemplateType;
  language: TemplateLanguage;
}

export interface IUpdateTemplateRequest {
  name: string;
  config: ITemplateConfig;
  // Deviation from the literal PUT contract (which only documents { name, config }):
  // the Template Editor's Language tab changes `language` on the same in-memory model
  // that's saved together with the rest of the editor, so we include it here too —
  // a backend that only binds `name`/`config` will simply ignore the extra field.
  language?: TemplateLanguage;
}

export interface ITemplateListResponse {
  templates: ITemplateSummary[];
}
