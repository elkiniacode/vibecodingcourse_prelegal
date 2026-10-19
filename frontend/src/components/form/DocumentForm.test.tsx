import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mutualNda } from "@/lib/documents/mutual-nda";
import { defaultValues } from "@/lib/engine/fields";
import type { FieldValues } from "@/lib/engine/model";
import { DocumentForm } from "./DocumentForm";

function renderForm(overrides: FieldValues = {}) {
  const onChange = vi.fn();
  const values = { ...defaultValues(mutualNda.fields, "2026-10-18"), ...overrides };
  render(<DocumentForm fields={mutualNda.fields} values={values} onChange={onChange} />);
  return onChange;
}

describe("DocumentForm", () => {
  it("groups the fields into labelled sections", () => {
    renderForm();
    for (const group of ["Agreement terms", "Party 1", "Party 2"]) {
      expect(screen.getByRole("group", { name: group })).toBeInTheDocument();
    }
  });

  it("shows each field's current value and help text", () => {
    renderForm();
    const purpose = screen.getByLabelText("Purpose");
    expect(purpose).toHaveValue(
      "Evaluating whether to enter into a business relationship with the other party.",
    );
    expect(purpose).toHaveAccessibleDescription("How Confidential Information may be used");
    expect(screen.getByLabelText("Effective Date")).toHaveValue("2026-10-18");
    expect(screen.getByLabelText("Expires after a set number of years")).toBeChecked();
  });

  it("reports typing with the field id", async () => {
    const onChange = renderForm();
    const partyTwo = within(screen.getByRole("group", { name: "Party 2" }));
    await userEvent.type(partyTwo.getByLabelText("Company"), "G");
    expect(onChange).toHaveBeenCalledWith("party2Company", "G");
  });

  it("reports option changes", async () => {
    const onChange = renderForm();
    await userEvent.click(screen.getByLabelText("In perpetuity"));
    expect(onChange).toHaveBeenCalledWith("confidentialityTerm", "perpetual");
  });

  it("only asks for a number of years when a set term is chosen", () => {
    renderForm({ mndaTerm: "untilTerminated" });
    expect(screen.queryByLabelText("Years until the MNDA expires")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Years Confidential Information is protected")).toHaveValue(1);
  });
});
