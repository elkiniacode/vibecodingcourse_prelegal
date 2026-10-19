import { describe, expect, it } from "vitest";
import { parseInline, parseTemplate } from "./parse";

const text = (value: string) => ({ type: "text", text: value });

describe("parseInline", () => {
  it("splits bold, links, defined terms and field placeholders out of plain text", () => {
    expect(
      parseInline(
        'the ("**MNDA**") under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) for the <span class="coverpage_link">Purpose</span> on {{effectiveDate}}.',
      ),
    ).toEqual([
      text('the ("'),
      { type: "strong", text: "MNDA" },
      text('") under '),
      { type: "link", text: "CC BY 4.0", href: "https://creativecommons.org/licenses/by/4.0/" },
      text(" for the "),
      { type: "term", text: "Purpose" },
      text(" on "),
      { type: "field", fieldId: "effectiveDate" },
      text("."),
    ]);
  });

  it("treats any *_link span as a defined term", () => {
    expect(parseInline('<span class="orderform_link">Customer</span>')).toEqual([
      { type: "term", text: "Customer" },
    ]);
  });

  it("drops other HTML tags but keeps their text", () => {
    expect(parseInline('<span class="header_2" id="1">Definitions</span> apply')).toEqual([
      text("Definitions apply"),
    ]);
  });

  it("leaves bracketed placeholders without a URL as plain text", () => {
    expect(parseInline("Expires [1 year(s)] from Effective Date.")).toEqual([
      text("Expires [1 year(s)] from Effective Date."),
    ]);
  });

  it("returns nothing for an empty string", () => {
    expect(parseInline("")).toEqual([]);
  });
});

describe("parseTemplate", () => {
  it("parses headings, multi-line paragraphs and lists whose items are separated by blank lines", () => {
    const markdown = [
      "# Title",
      "",
      "First line",
      "second line.",
      "",
      "1. One",
      "",
      "2. Two",
      "continued",
      "",
      "After the list.",
      "",
      "- a",
      "- b",
    ].join("\n");

    expect(parseTemplate(markdown)).toEqual([
      { type: "heading", level: 1, content: [text("Title")] },
      { type: "paragraph", content: [text("First line second line.")] },
      { type: "list", ordered: true, start: 1, items: [[text("One")], [text("Two continued")]] },
      { type: "paragraph", content: [text("After the list.")] },
      { type: "list", ordered: false, start: 1, items: [[text("a")], [text("b")]] },
    ]);
  });

  it("starts an ordered list at its first number", () => {
    expect(parseTemplate("3. Three\n4. Four")).toEqual([
      { type: "list", ordered: true, start: 3, items: [[text("Three")], [text("Four")]] },
    ]);
  });

  it("caps heading levels at 3", () => {
    expect(parseTemplate("#### Deep")).toEqual([
      { type: "heading", level: 3, content: [text("Deep")] },
    ]);
  });

  it("handles Windows line endings", () => {
    expect(parseTemplate("# A\r\n\r\nB\r\n")).toEqual([
      { type: "heading", level: 1, content: [text("A")] },
      { type: "paragraph", content: [text("B")] },
    ]);
  });
});
