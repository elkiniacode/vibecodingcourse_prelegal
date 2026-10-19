"use client";

import { useState } from "react";
import type { DocumentModel, FieldValues } from "@/lib/engine/model";

interface DownloadButtonProps {
  model: DocumentModel;
  values: FieldValues;
}

export function DownloadButton({ model, values }: DownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");

  async function handleClick() {
    setStatus("generating");
    try {
      // react-pdf is large, so it is only loaded once someone asks for a PDF
      const { downloadPdf } = await import("@/lib/pdf/downloadPdf");
      await downloadPdf(model, values);
      setStatus("idle");
    } catch (error) {
      console.error("PDF generation failed", error);
      setStatus("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "generating"}
        className="w-full rounded-md bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-wait disabled:opacity-70"
      >
        {status === "generating" ? "Generating PDF…" : "Download PDF"}
      </button>
      <p role="status" className="sr-only">
        {status === "generating" ? "Generating PDF…" : ""}
      </p>
      {status === "error" && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          Couldn&apos;t create the PDF. Please try again.
        </p>
      )}
    </div>
  );
}
