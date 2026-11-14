export type FormId = "drape" | "flat" | "shirt" | "trousers" | "skirt" | "cushion";

export interface FormDef {
  id: FormId;
  name: string;
  /** Used in sentences: "Velvet as a cushion". */
  phrase: string;
}

/** The shapes a fabric can be previewed on. */
export const FORMS: FormDef[] = [
  { id: "drape", name: "Drape", phrase: "as a hanging drape" },
  { id: "flat", name: "Flat cloth", phrase: "as a flat length" },
  { id: "shirt", name: "T-shirt", phrase: "as a T-shirt" },
  { id: "trousers", name: "Trousers", phrase: "as trousers" },
  { id: "skirt", name: "Skirt", phrase: "as a skirt" },
  { id: "cushion", name: "Cushion", phrase: "as a cushion" },
];

export const FORM_BY_ID = Object.fromEntries(FORMS.map((f) => [f.id, f])) as Record<
  FormId,
  FormDef
>;

export const DEFAULT_FORM: FormId = "drape";

export function isFormId(value: string | null): value is FormId {
  return value !== null && value in FORM_BY_ID;
}
