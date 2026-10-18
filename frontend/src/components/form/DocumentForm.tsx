import { isFieldVisible } from "@/lib/engine/fields";
import type { FieldDefinition, FieldValues } from "@/lib/engine/model";
import { FieldInput } from "./FieldInput";

interface DocumentFormProps {
  fields: FieldDefinition[];
  values: FieldValues;
  onChange: (fieldId: string, value: string) => void;
}

/** Renders a document's fields, one fieldset per group, in definition order. */
export function DocumentForm({ fields, values, onChange }: DocumentFormProps) {
  const groups = new Map<string, FieldDefinition[]>();
  for (const field of fields) {
    groups.set(field.group, [...(groups.get(field.group) ?? []), field]);
  }

  return (
    <form className="space-y-10" onSubmit={(event) => event.preventDefault()}>
      {[...groups].map(([group, groupFields]) => (
        <fieldset key={group} className="space-y-5">
          <legend className="text-xs font-semibold uppercase tracking-wider text-primary">
            {group}
          </legend>
          {groupFields
            .filter((field) => isFieldVisible(field, values))
            .map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={values[field.id] ?? ""}
                onChange={(value) => onChange(field.id, value)}
              />
            ))}
        </fieldset>
      ))}
    </form>
  );
}
