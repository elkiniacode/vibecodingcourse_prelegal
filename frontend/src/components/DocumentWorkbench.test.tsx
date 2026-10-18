import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mutualNda } from "@/lib/documents/mutual-nda";
import { loadDocumentModel } from "@/lib/engine/load";
import { downloadPdf } from "@/lib/pdf/downloadPdf";
import { DocumentWorkbench } from "./DocumentWorkbench";

vi.mock("@/lib/pdf/downloadPdf", () => ({ downloadPdf: vi.fn() }));

const model = loadDocumentModel(mutualNda);
const preview = () => within(screen.getByRole("article", { name: model.title }));

beforeEach(() => {
  // Only fake the clock's date so user-event's timers keep working
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 18, 9, 30));
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(downloadPdf).mockReset();
});

describe("DocumentWorkbench", () => {
  it("defaults the effective date to today", () => {
    render(<DocumentWorkbench model={model} />);
    expect(screen.getByLabelText("Effective Date")).toHaveValue("2026-10-18");
    expect(preview().getByText("October 18, 2026")).toBeInTheDocument();
  });

  it("updates the preview as the user types", async () => {
    render(<DocumentWorkbench model={model} />);
    const partyOne = within(screen.getByRole("group", { name: "Party 1" }));
    await userEvent.type(partyOne.getByLabelText("Company"), "Acme Corp");
    expect(preview().getByText("Acme Corp")).toBeInTheDocument();
  });

  it("lets the user clear the effective date instead of snapping back to today", () => {
    render(<DocumentWorkbench model={model} />);
    fireEvent.change(screen.getByLabelText("Effective Date"), { target: { value: "" } });
    expect(screen.getByLabelText("Effective Date")).toHaveValue("");
    expect(preview().getByText("[Effective Date]")).toBeInTheDocument();
  });

  it("hides the years input and updates the options when the MNDA has no set term", async () => {
    render(<DocumentWorkbench model={model} />);
    await userEvent.click(screen.getByLabelText("Continues until terminated"));
    expect(screen.queryByLabelText("Years until the MNDA expires")).not.toBeInTheDocument();
    const option = preview()
      .getByText("Continues until terminated in accordance with the terms of the MNDA.")
      .closest("li");
    expect(option?.querySelector(".sr-only")).toHaveTextContent("Selected:");
  });

  it("downloads a PDF of the values currently on screen", async () => {
    vi.mocked(downloadPdf).mockResolvedValue();
    render(<DocumentWorkbench model={model} />);
    await userEvent.type(screen.getByLabelText("Governing Law"), "Delaware");
    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() =>
      expect(downloadPdf).toHaveBeenCalledWith(
        model,
        expect.objectContaining({ governingLaw: "Delaware", effectiveDate: "2026-10-18" }),
      ),
    );
  });

  it("prerenders without a date and fills it in after hydration without mismatches", async () => {
    const html = renderToString(<DocumentWorkbench model={model} />);
    expect(html).not.toContain("October 18, 2026");

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, <DocumentWorkbench model={model} />, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(within(container).getByText("October 18, 2026")).toBeInTheDocument();
    act(() => root?.unmount());
    container.remove();
  });
});
