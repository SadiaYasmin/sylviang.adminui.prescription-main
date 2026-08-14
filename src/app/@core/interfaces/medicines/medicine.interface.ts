export interface IMedicineSummary {
  medicineId: number;
  brandName: string;
  genericName: string | null;
  strength: string | null;
  dosageForm: string | null;
  category: string | null;
}
