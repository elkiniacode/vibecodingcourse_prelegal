import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadDocumentModel } from "@/lib/engine/load";
import type { Block, Inline } from "@/lib/engine/model";
import { mutualNda } from "./mutual-nda";

const model = loadDocumentModel(mutualNda);
const [coverPage, standardTerms] = model.sections;
const coverTemplate = readFileSync(
  path.join(process.cwd(), "..", "templates", "Mutual-NDA-coverpage.md"),
  "utf8",
);

/** Every run of inline content in a block, e.g. one per list item or table cell. */
function contentRuns(block: Block): Inline[][] {
  switch (block.type) {
    case "heading":
    case "paragraph":
      return [block.content];
    case "list":
      return block.items;
    case "options":
      return block.options.map((option) => option.content);
    case "table":
      return block.rows.flatMap((row) => row.cells);
  }
}

const inlinesOf = (blocks: Block[]) => blocks.flatMap(contentRuns).flat();

/** Rebuilds the markdown between field placeholders, e.g. "Expires {{x}} from" gives ["Expires", "from"]. */
function literalFragments(content: Inline[]): string[] {
  const fragments = [""];
  for (const inline of content) {
    if (inline.type === "field") fragments.push("");
    else if (inline.type === "strong") fragments[fragments.length - 1] += `**${inline.text}**`;
    else if (inline.type === "link")
      fragments[fragments.length - 1] += `[${inline.text}](${inline.href})`;
    else fragments[fragments.length - 1] += inline.text;
  }
  return fragments.map((fragment) => fragment.trim()).filter(Boolean);
}

describe("Mutual NDA standard terms", () => {
  it("are the 11 numbered clauses of Mutual-NDA.md", () => {
    const clauses = standardTerms.blocks.find((block) => block.type === "list");
    expect(clauses).toMatchObject({ ordered: true, start: 1 });
    expect(clauses?.type === "list" && clauses.items).toHaveLength(11);
    expect(clauses?.type === "list" && clauses.items[0][0]).toEqual({
      type: "strong",
      text: "Introduction",
    });
  });

  it("refer to the cover-page terms where the template does", () => {
    const counts: Record<string, number> = {};
    for (const inline of inlinesOf(standardTerms.blocks)) {
      if (inline.type === "term") counts[inline.text] = (counts[inline.text] ?? 0) + 1;
    }
    expect(counts).toEqual({
      Purpose: 3,
      "Effective Date": 1,
      "MNDA Term": 1,
      "Term of Confidentiality": 1,
      "Governing Law": 2,
      Jurisdiction: 2,
    });
  });

  it("contain no leftover markup", () => {
    for (const inline of inlinesOf(standardTerms.blocks)) {
      if (inline.type === "text") expect(inline.text).not.toMatch(/<|\*\*|\]\(/);
    }
  });

  it("keep the CC BY 4.0 attribution", () => {
    expect(inlinesOf(standardTerms.blocks)).toContainEqual({
      type: "link",
      text: "CC BY 4.0",
      href: "https://creativecommons.org/licenses/by/4.0/",
    });
  });
});

describe("Mutual NDA definition", () => {
  it("gives every defined term in the standard terms a cover-page anchor", () => {
    const anchors = coverPage.blocks.flatMap((block) =>
      "anchor" in block && block.anchor ? [block.anchor] : [],
    );
    const terms = inlinesOf(standardTerms.blocks).flatMap((inline) =>
      inline.type === "term" ? [inline.text] : [],
    );
    expect(new Set(anchors)).toEqual(new Set(terms));
  });

  it("shows every field it defines, and only those", () => {
    const shown = new Set<string>();
    for (const block of coverPage.blocks) {
      if (block.type === "options") shown.add(block.fieldId);
      for (const inline of contentRuns(block).flat()) {
        if (inline.type === "field") shown.add(inline.fieldId);
      }
    }
    expect(shown).toEqual(new Set(mutualNda.fields.map((field) => field.id)));
  });

  it("uses unique field ids", () => {
    const ids = mutualNda.fields.map((field) => field.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matches the wording of Mutual-NDA-coverpage.md", () => {
    const fragments = coverPage.blocks.flatMap((block) => [
      ...contentRuns(block).flatMap(literalFragments),
      ...(block.type === "table" ? [...block.columns, ...block.rows.map((row) => row.label)] : []),
    ]);
    expect(fragments.length).toBeGreaterThan(20);
    for (const fragment of fragments) {
      expect(coverTemplate, `cover page text "${fragment}"`).toContain(fragment);
    }
  });

  it("defaults the purpose to the template's suggested wording", () => {
    const purpose = mutualNda.fields.find((field) => field.id === "purpose");
    expect(coverTemplate).toContain(`[${purpose?.defaultValue}]`);
  });
});
