import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mutualNda } from "@/lib/documents/mutual-nda";
import { defaultValues } from "@/lib/engine/fields";
import { loadDocumentModel } from "@/lib/engine/load";
import type { FieldValues } from "@/lib/engine/model";
import { DocumentPreview } from "./DocumentPreview";

const model = loadDocumentModel(mutualNda);

function renderPreview(overrides: FieldValues = {}) {
  const values = { ...defaultValues(model.fields, "2026-10-18"), ...overrides };
  return render(<DocumentPreview model={model} values={values} />);
}

const field = (container: HTMLElement, fieldId: string) =>
  container.querySelectorAll(`[data-field="${fieldId}"]`);

/** The screen-reader status ("Selected:" / "Not selected:") of the option with this text. */
const optionStatus = (text: string | RegExp) =>
  screen.getByText(text).closest("li")?.querySelector(".sr-only")?.textContent?.trim();

describe("DocumentPreview", () => {
  it("fills the cover page with the user's values", () => {
    const { container } = renderPreview({
      governingLaw: "Delaware",
      jurisdiction: "New Castle, DE",
      party1Company: "Acme Corp",
      mndaTermYears: "2",
    });
    expect(document.getElementById("term-governing-law")).toHaveTextContent(
      "Governing Law: Delaware",
    );
    expect(document.getElementById("term-jurisdiction")).toHaveTextContent(
      "Jurisdiction: New Castle, DE",
    );
    expect(field(container, "effectiveDate")[0]).toHaveTextContent("October 18, 2026");
    expect(field(container, "party1Company")[0]).toHaveTextContent("Acme Corp");
    expect(screen.getByText(/Expires/)).toHaveTextContent("Expires 2 years from Effective Date.");
  });

  it("highlights fields that still need a value", () => {
    const { container } = renderPreview();
    const blank = field(container, "governingLaw")[0];
    expect(blank.tagName).toBe("MARK");
    expect(blank).toHaveTextContent("[Governing Law]");
  });

  it("renders user input as text, never as markup", () => {
    const { container } = renderPreview({ party1Company: '<img src=x onerror="alert(1)">' });
    expect(field(container, "party1Company")[0]).toHaveTextContent('<img src=x onerror="alert(1)">');
    expect(container.querySelector("img")).toBeNull();
  });

  it("marks which term options were chosen", () => {
    renderPreview({ mndaTerm: "untilTerminated", confidentialityTerm: "perpetual" });
    expect(optionStatus("Continues until terminated in accordance with the terms of the MNDA.")).toBe(
      "Selected:",
    );
    expect(optionStatus(/^Expires/)).toBe("Not selected:");
    expect(optionStatus("In perpetuity.")).toBe("Selected:");
  });

  it("keeps the standard terms verbatim and links their defined terms to the cover page", () => {
    renderPreview({ governingLaw: "Delaware" });
    expect(screen.getByText(/are governed by, and construed in accordance with/)).toHaveTextContent(
      "the laws of the State of Governing Law, without regard to the conflict of laws provisions of such Governing Law",
    );
    const links = screen.getAllByRole("link", { name: "Governing Law" });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute("href", "#term-governing-law");
  });

  it("says None. when there are no modifications", () => {
    const { container } = renderPreview();
    expect(field(container, "modifications")[0]).toHaveTextContent("None.");
  });

  it("leaves the signature and date lines blank for signing", () => {
    renderPreview();
    for (const label of ["Signature", "Date"]) {
      const cells = screen.getByRole("rowheader", { name: label }).parentElement!.querySelectorAll("td");
      expect(cells).toHaveLength(2);
      for (const cell of cells) expect(cell).toHaveTextContent("");
    }
  });

  it("keeps both CC BY 4.0 attributions", () => {
    renderPreview();
    expect(screen.getAllByRole("link", { name: "CC BY 4.0" })).toHaveLength(2);
  });
});
