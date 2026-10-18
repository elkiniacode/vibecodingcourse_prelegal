import { formatCount, formatLongDate } from "./format";
import type { FieldDefinition, FieldValues } from "./model";

export interface ResolvedValue {
  label: string;
  /** Display text for the document; empty when the field is unfilled. */
  text: string;
  filled: boolean;
}

export type FieldResolver = (fieldId: string) => ResolvedValue;

/** Turns a raw form value into the text the document shows for it. */
export function resolveField(field: FieldDefinition, rawValue = ""): ResolvedValue {
  const value = rawValue.trim();
  const text = value ? formatValue(field, value) : (field.emptyText ?? null);
  return { label: field.label, text: text ?? "", filled: text !== null };
}

function formatValue(field: FieldDefinition, value: string): string | null {
  switch (field.kind) {
    case "date":
      return formatLongDate(value);
    case "number":
      return formatCount(value, field.unit);
    case "choice":
      return field.options.find((option) => option.value === value)?.label ?? null;
    default:
      return value;
  }
}

/** Builds the lookup both renderers use, so the preview and the PDF always show the same text. */
export function createFieldResolver(
  fields: FieldDefinition[],
  values: FieldValues,
): FieldResolver {
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  return (fieldId) => {
    const field = fieldsById.get(fieldId);
    if (!field) throw new Error(`Unknown field "${fieldId}"`);
    return resolveField(field, values[fieldId]);
  };
}

export function isFieldVisible(field: FieldDefinition, values: FieldValues): boolean {
  return !field.showWhen || values[field.showWhen.fieldId] === field.showWhen.equals;
}

/**
 * Default form values. `today` (yyyy-mm-dd) is passed in because it depends on
 * the viewer's clock; pass "" while it is unknown, e.g. when prerendering.
 */
export function defaultValues(fields: FieldDefinition[], today: string): FieldValues {
  return Object.fromEntries(
    fields.map((field) => [
      field.id,
      field.kind === "date" && field.defaultsToToday ? today : (field.defaultValue ?? ""),
    ]),
  );
}
