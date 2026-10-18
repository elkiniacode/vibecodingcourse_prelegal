/**
 * Renderer-agnostic shapes for legal documents. A DocumentDefinition describes
 * a document type as plain data; loading it produces a DocumentModel that the
 * HTML preview and the PDF renderer both walk, so their content cannot drift.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "link"; text: string; href: string }
  /** A defined term (e.g. "Purpose") whose value is given on the cover page. */
  | { type: "term"; text: string }
  /** A value the user fills in through the form. */
  | { type: "field"; fieldId: string };

export interface TableRow {
  label: string;
  /** One cell per column; an empty cell is left blank, e.g. for signing. */
  cells: Inline[][];
}

export type Block =
  | {
      type: "heading";
      level: 1 | 2 | 3;
      content: Inline[];
      /** Defined term this block gives the value for; term references link to it. */
      anchor?: string;
    }
  | { type: "paragraph"; content: Inline[]; anchor?: string }
  | { type: "list"; ordered: boolean; start: number; items: Inline[][] }
  /** Checkbox-style options with the one matching the field's value marked. */
  | {
      type: "options";
      fieldId: string;
      options: { value: string; content: Inline[] }[];
    }
  | { type: "table"; columns: string[]; rows: TableRow[] };

export interface DocumentSection {
  id: string;
  blocks: Block[];
}

interface FieldBase {
  id: string;
  label: string;
  /** Form section the field is grouped under. */
  group: string;
  /** Short guidance shown with the input. */
  help?: string;
  placeholder?: string;
  defaultValue?: string;
  /** Shown in the document when the field is left empty; without it an empty field shows as a blank. */
  emptyText?: string;
  /** Only show the input while another field has the given value. */
  showWhen?: { fieldId: string; equals: string };
}

export type FieldDefinition =
  | (FieldBase & { kind: "text" | "textarea" })
  | (FieldBase & { kind: "date"; defaultsToToday?: boolean })
  | (FieldBase & { kind: "number"; unit?: { singular: string; plural: string } })
  | (FieldBase & { kind: "choice"; options: { value: string; label: string }[] });

/** Raw form values keyed by field id, exactly as the inputs hold them. */
export type FieldValues = Record<string, string>;

export type SectionSource =
  /** Content written in code, e.g. a cover page whose markdown is mostly form scaffolding. */
  | DocumentSection
  /** A markdown file in the repo's templates/ directory, parsed at build time. */
  | { id: string; template: string };

export interface DocumentDefinition {
  id: string;
  title: string;
  /** File name of the downloaded PDF. */
  fileName: string;
  fields: FieldDefinition[];
  sections: SectionSource[];
}

/** A definition with every section resolved to blocks. Plain JSON, so it can cross the server/client boundary. */
export interface DocumentModel extends Omit<DocumentDefinition, "sections"> {
  sections: DocumentSection[];
}

/** DOM / PDF id of the block that gives a defined term's value. */
export function anchorId(term: string): string {
  return `term-${term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
