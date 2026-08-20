/**
 * Shared medicine-duplicate detection — medicine + strength is the identity key. Used both
 * by `medicine-list-input.component.ts` (manual typing / autocomplete-select) and each
 * template's `addMedicinePreset()` (Quick Add insertion), since Quick Add writes straight
 * into `content.medicines` from the parent and never went through the child's own guard —
 * that's how two identical Quick Add rows could land back to back with no check at all.
 */
export interface IMedicineIdentity {
  medicine: string;
  strength?: string | null;
}

const normalize = (v: string | null | undefined) => (v ?? '').trim().toLowerCase();

/** Index of an existing item with the exact same medicine + strength (the true duplicate — block this), excluding `excludeIndex`. -1 if none. */
export function findExactMedicineDuplicateIndex<T extends IMedicineIdentity>(items: T[], candidate: IMedicineIdentity, excludeIndex = -1): number {
  const name = normalize(candidate.medicine);
  if (!name) return -1;
  const strength = normalize(candidate.strength);
  return items.findIndex((m, i) => i !== excludeIndex && normalize(m.medicine) === name && normalize(m.strength) === strength);
}

/** Index of an existing item with the same medicine name but a different strength (allowed — just worth flagging), excluding `excludeIndex`. -1 if none. */
export function findSameNameDifferentStrengthIndex<T extends IMedicineIdentity>(items: T[], candidate: IMedicineIdentity, excludeIndex = -1): number {
  const name = normalize(candidate.medicine);
  if (!name) return -1;
  const strength = normalize(candidate.strength);
  return items.findIndex((m, i) => i !== excludeIndex && normalize(m.medicine) === name && normalize(m.strength) !== strength);
}
