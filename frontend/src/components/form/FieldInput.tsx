import type { ChangeEvent } from "react";
import type { FieldDefinition } from "@/lib/engine/model";

const LABEL = "block text-sm font-medium text-navy";
const INPUT =
  "mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

interface FieldInputProps {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
}

export function FieldInput({ field, value, onChange }: FieldInputProps) {
  const id = `field-${field.id}`;
  const helpId = field.help ? `${id}-help` : undefined;
  const help = field.help && (
    <p id={helpId} className="mt-0.5 text-xs text-muted">
      {field.help}
    </p>
  );

  if (field.kind === "choice") {
    return (
      <fieldset aria-describedby={helpId}>
        <legend className={LABEL}>{field.label}</legend>
        {help}
        <div className="mt-2 space-y-2">
          {field.options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="size-4 accent-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  const inputProps = {
    id,
    value,
    placeholder: field.placeholder,
    "aria-describedby": helpId,
    className: INPUT,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
  };

  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {field.label}
      </label>
      {help}
      {field.kind === "textarea" ? (
        <textarea rows={3} {...inputProps} />
      ) : field.kind === "number" ? (
        <input type="number" min={1} step={1} inputMode="numeric" {...inputProps} />
      ) : (
        <input type={field.kind} {...inputProps} />
      )}
    </div>
  );
}
