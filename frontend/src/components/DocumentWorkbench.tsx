"use client";

import { useState } from "react";
import { defaultValues } from "@/lib/engine/fields";
import type { DocumentModel, FieldValues } from "@/lib/engine/model";
import { useToday } from "@/lib/useToday";
import { DownloadButton } from "./DownloadButton";
import { DocumentForm } from "./form/DocumentForm";
import { DocumentPreview } from "./preview/DocumentPreview";

/** Form on one side, live preview on the other; stacks on narrow screens. */
export function DocumentWorkbench({ model }: { model: DocumentModel }) {
  const today = useToday();
  // Only what the user has typed; anything untouched falls back to its default
  const [edits, setEdits] = useState<FieldValues>({});
  const values = { ...defaultValues(model.fields, today), ...edits };

  const updateField = (fieldId: string, value: string) =>
    setEdits((current) => ({ ...current, [fieldId]: value }));

  return (
    <main className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(22rem,30rem)_1fr]">
      <section
        aria-labelledby="form-heading"
        className="flex flex-col border-slate-200 bg-white lg:min-h-0 lg:border-r"
      >
        <div className="flex-1 px-6 py-6 lg:overflow-y-auto">
          <h2 id="form-heading" className="text-lg font-semibold text-navy">
            Agreement details
          </h2>
          <p className="mt-1 text-sm text-muted">The preview updates as you type.</p>
          <div className="mt-6">
            <DocumentForm fields={model.fields} values={values} onChange={updateField} />
          </div>
        </div>
        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
          <DownloadButton model={model} values={values} />
        </div>
      </section>
      <section
        aria-label="Document preview"
        className="bg-slate-100 px-4 py-6 sm:px-8 lg:min-h-0 lg:overflow-y-auto"
      >
        <DocumentPreview model={model} values={values} />
      </section>
    </main>
  );
}
