import { describe, expect, it } from "vitest";
import { loadDocumentModel } from "./load";
import type { Block, DocumentDefinition } from "./model";

const written: Block[] = [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }];

const definition: DocumentDefinition = {
  id: "example",
  title: "Example",
  fileName: "Example.pdf",
  fields: [],
  sections: [
    { id: "written", blocks: written },
    { id: "parsed", template: "Mutual-NDA.md" },
  ],
};

describe("loadDocumentModel", () => {
  it("keeps written sections and parses template sections from the repo's templates/", () => {
    const model = loadDocumentModel(definition);

    expect(model).toMatchObject({ id: "example", title: "Example", fileName: "Example.pdf" });
    expect(model.sections[0]).toEqual({ id: "written", blocks: written });
    expect(model.sections[1].id).toBe("parsed");
    expect(model.sections[1].blocks[0]).toEqual({
      type: "heading",
      level: 1,
      content: [{ type: "text", text: "Standard Terms" }],
    });
  });

  it("produces plain JSON that can be passed to client components", () => {
    const model = loadDocumentModel(definition);
    expect(JSON.parse(JSON.stringify(model))).toEqual(model);
  });

  it("fails the build when a template is missing", () => {
    expect(() =>
      loadDocumentModel({ ...definition, sections: [{ id: "x", template: "Missing.md" }] }),
    ).toThrow(/Missing\.md/);
  });
});
