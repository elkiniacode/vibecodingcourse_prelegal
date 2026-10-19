import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mutualNda } from "@/lib/documents/mutual-nda";
import { loadDocumentModel } from "@/lib/engine/load";
import { downloadPdf } from "@/lib/pdf/downloadPdf";
import { DownloadButton } from "./DownloadButton";

vi.mock("@/lib/pdf/downloadPdf", () => ({ downloadPdf: vi.fn() }));

const model = loadDocumentModel(mutualNda);

afterEach(() => {
  vi.mocked(downloadPdf).mockReset();
  vi.restoreAllMocks();
});

describe("DownloadButton", () => {
  it("shows progress while the PDF is generated", async () => {
    let finish: () => void = () => {};
    vi.mocked(downloadPdf).mockImplementation(() => new Promise<void>((done) => (finish = done)));
    render(<DownloadButton model={model} values={{}} />);

    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(screen.getByRole("button", { name: "Generating PDF…" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Generating PDF…");

    finish();
    expect(await screen.findByRole("button", { name: "Download PDF" })).toBeEnabled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("tells the user when the PDF can't be created", async () => {
    vi.mocked(downloadPdf).mockRejectedValue(new Error("render failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<DownloadButton model={model} values={{}} />);

    await userEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't create the PDF");
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
  });
});
