import { readFileSync } from "node:fs";
import path from "node:path";
import type { DocumentDefinition, DocumentModel } from "./model";
import { parseTemplate } from "./parse";

/** The repo-level templates/ directory; npm scripts run from frontend/. */
const TEMPLATES_DIR = path.join(process.cwd(), "..", "templates");

/**
 * Resolves every section of a definition to blocks. Reads templates from disk,
 * so it only runs on the server, which for the static export means at build time.
 */
export function loadDocumentModel(definition: DocumentDefinition): DocumentModel {
  const { sections, ...rest } = definition;
  return {
    ...rest,
    sections: sections.map((section) => ({
      id: section.id,
      blocks:
        "template" in section
          ? parseTemplate(readFileSync(path.join(TEMPLATES_DIR, section.template), "utf8"))
          : section.blocks,
    })),
  };
}
