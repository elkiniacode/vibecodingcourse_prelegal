import { pdf } from "@react-pdf/renderer";
import type { DocumentModel, FieldValues } from "@/lib/engine/model";
import { DocumentPdf } from "./DocumentPdf";

/**
 * Renders the document to a PDF in the browser and saves it locally.
 * Import this module dynamically: it pulls in react-pdf, which is large.
 */
export async function downloadPdf(model: DocumentModel, values: FieldValues): Promise<void> {
  const blob = await pdf(<DocumentPdf model={model} values={values} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = model.fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser time to start reading the blob before releasing it
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
