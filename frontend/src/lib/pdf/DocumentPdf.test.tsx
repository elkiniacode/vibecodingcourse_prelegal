// @vitest-environment node
import { renderToBuffer } from "@react-pdf/renderer";
import { extractText, getDocumentProxy } from "unpdf";
import { describe, expect, it } from "vitest";
import { mutualNda } from "@/lib/documents/mutual-nda";
import { defaultValues } from "@/lib/engine/fields";
import { loadDocumentModel } from "@/lib/engine/load";
import type { FieldValues } from "@/lib/engine/model";
import { breakLongWords, DocumentPdf } from "./DocumentPdf";

const model = loadDocumentModel(mutualNda);

async function renderPdf(overrides: FieldValues = {}) {
  const values = { ...defaultValues(model.fields, "2026-10-18"), ...overrides };
  const buffer = await renderToBuffer(<DocumentPdf model={model} values={values} />);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return { buffer, text, pages: pdf.numPages };
}

describe("DocumentPdf", { timeout: 30_000 }, () => {
  it("renders the cover page with the user's values followed by the standard terms", async () => {
    const { buffer, text, pages } = await renderPdf({
      governingLaw: "Delaware",
      jurisdiction: "New Castle, DE",
      party1Company: "Acme Corp",
      party2Company: "Globex Inc",
    });

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pages).toBeGreaterThanOrEqual(2);
    expect(text).toContain("Mutual Non-Disclosure Agreement");
    expect(text).toContain("October 18, 2026");
    expect(text).toContain("Governing Law: Delaware");
    expect(text).toContain("Jurisdiction: New Castle, DE");
    expect(text).toContain("Acme Corp");
    expect(text).toContain("Globex Inc");
    expect(text).toContain("Standard Terms");
    expect(text).toContain("Equitable Relief");
    expect(text).toContain("CC BY 4.0");
  });

  it("leaves a blank line for each value still missing", async () => {
    const { text } = await renderPdf();
    expect(text).toContain("Governing Law: ________________");
  });

  it("wraps a long email address inside its table cell instead of overflowing", async () => {
    const email = "ada.lovelace.longname@acme-corporation-international.example";
    const { text } = await renderPdf({ party1NoticeAddress: email });
    expect(text).not.toContain(email);
    // Undoing the inserted "-" + line break gives back the address exactly
    expect(text.replace(/-\s+/g, "")).toContain(email);
  });
});

describe("breakLongWords", () => {
  it("keeps ordinary words whole", () => {
    expect(breakLongWords("Confidential")).toEqual(["Confidential"]);
    expect(breakLongWords("contemporaneous")).toEqual(["contemporaneous"]);
  });

  it("splits tokens too long to fit a table cell into breakable pieces", () => {
    const pieces = breakLongWords("ada.lovelace.longname@acme-corporation.example");
    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.join("")).toBe("ada.lovelace.longname@acme-corporation.example");
  });
});
