import { IExamination } from '@core/interfaces/prescriptions/prescription.interface';

/**
 * Whether any O/E vitals field has a value — used by each template component to decide
 * whether to render the O/E section wrapper (border/title/spacing) at all in read-only/
 * finalized/PDF/print view. Mirrors `VitalsInputComponent.hasAnyVitalData` exactly (that
 * component can't be queried directly from the parent template without a ViewChild, so the
 * check is duplicated here as a small shared function rather than one-off per template).
 * BMI is deliberately excluded — it's derived from Weight/Height, not entered, so it never
 * factors into "was anything recorded" on its own.
 */
export function hasExaminationData(examination: IExamination): boolean {
  return Object.values(examination).some((v) => !!v);
}
