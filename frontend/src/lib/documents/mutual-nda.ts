import type { Block, DocumentDefinition, FieldDefinition, Inline, TableRow } from "@/lib/engine/model";
import { parseInline } from "@/lib/engine/parse";

const TERMS = "Agreement terms";
const YEARS = { singular: "year", plural: "years" };

function partyFields(party: 1 | 2): FieldDefinition[] {
  const group = `Party ${party}`;
  return [
    { id: `party${party}Name`, kind: "text", group, label: "Print Name" },
    { id: `party${party}Title`, kind: "text", group, label: "Title" },
    { id: `party${party}Company`, kind: "text", group, label: "Company" },
    {
      id: `party${party}NoticeAddress`,
      kind: "textarea",
      group,
      label: "Notice Address",
      help: "Use either email or postal address",
    },
  ];
}

const fields: FieldDefinition[] = [
  {
    id: "purpose",
    kind: "textarea",
    group: TERMS,
    label: "Purpose",
    help: "How Confidential Information may be used",
    defaultValue: "Evaluating whether to enter into a business relationship with the other party.",
  },
  { id: "effectiveDate", kind: "date", group: TERMS, label: "Effective Date", defaultsToToday: true },
  {
    id: "mndaTerm",
    kind: "choice",
    group: TERMS,
    label: "MNDA Term",
    help: "The length of this MNDA",
    defaultValue: "expires",
    options: [
      { value: "expires", label: "Expires after a set number of years" },
      { value: "untilTerminated", label: "Continues until terminated" },
    ],
  },
  {
    id: "mndaTermYears",
    kind: "number",
    group: TERMS,
    label: "Years until the MNDA expires",
    defaultValue: "1",
    unit: YEARS,
    showWhen: { fieldId: "mndaTerm", equals: "expires" },
  },
  {
    id: "confidentialityTerm",
    kind: "choice",
    group: TERMS,
    label: "Term of Confidentiality",
    help: "How long Confidential Information is protected",
    defaultValue: "years",
    options: [
      { value: "years", label: "A set number of years" },
      { value: "perpetual", label: "In perpetuity" },
    ],
  },
  {
    id: "confidentialityYears",
    kind: "number",
    group: TERMS,
    label: "Years Confidential Information is protected",
    defaultValue: "1",
    unit: YEARS,
    showWhen: { fieldId: "confidentialityTerm", equals: "years" },
  },
  {
    id: "governingLaw",
    kind: "text",
    group: TERMS,
    label: "Governing Law",
    help: "The state whose laws govern this MNDA",
    placeholder: "e.g. Delaware",
  },
  {
    id: "jurisdiction",
    kind: "text",
    group: TERMS,
    label: "Jurisdiction",
    help: "City or county and state of the courts that hear disputes",
    placeholder: "e.g. New Castle, DE",
  },
  {
    id: "modifications",
    kind: "textarea",
    group: TERMS,
    label: "MNDA Modifications",
    help: "Optional. List any modifications to the MNDA.",
    emptyText: "None.",
  },
  ...partyFields(1),
  ...partyFields(2),
];

const md = parseInline;
const field = (fieldId: string): Inline[] => [{ type: "field", fieldId }];
const partyRow = (label: string, suffix: string): TableRow => ({
  label,
  cells: [field(`party1${suffix}`), field(`party2${suffix}`)],
});

// Mirrors templates/Mutual-NDA-coverpage.md. It is written in code because that
// file is mostly form scaffolding (placeholders, checkboxes, a malformed table);
// a test checks this wording still matches the template.
const coverPage: Block[] = [
  { type: "heading", level: 1, content: md("Mutual Non-Disclosure Agreement") },
  { type: "heading", level: 2, content: md("USING THIS MUTUAL NON-DISCLOSURE AGREEMENT") },
  {
    type: "paragraph",
    content: md(
      'This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page ("**Cover Page**") and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 ("**Standard Terms**") identical to those posted at [commonpaper.com/standards/mutual-nda/1.0](https://commonpaper.com/standards/mutual-nda/1.0). Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.',
    ),
  },
  { type: "heading", level: 3, content: md("Purpose"), anchor: "Purpose" },
  { type: "paragraph", content: field("purpose") },
  { type: "heading", level: 3, content: md("Effective Date"), anchor: "Effective Date" },
  { type: "paragraph", content: field("effectiveDate") },
  { type: "heading", level: 3, content: md("MNDA Term"), anchor: "MNDA Term" },
  {
    type: "options",
    fieldId: "mndaTerm",
    options: [
      { value: "expires", content: md("Expires {{mndaTermYears}} from Effective Date.") },
      {
        value: "untilTerminated",
        content: md("Continues until terminated in accordance with the terms of the MNDA."),
      },
    ],
  },
  {
    type: "heading",
    level: 3,
    content: md("Term of Confidentiality"),
    anchor: "Term of Confidentiality",
  },
  {
    type: "options",
    fieldId: "confidentialityTerm",
    options: [
      {
        value: "years",
        content: md(
          "{{confidentialityYears}} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
        ),
      },
      { value: "perpetual", content: md("In perpetuity.") },
    ],
  },
  { type: "heading", level: 3, content: md("Governing Law & Jurisdiction") },
  { type: "paragraph", content: md("Governing Law: {{governingLaw}}"), anchor: "Governing Law" },
  { type: "paragraph", content: md("Jurisdiction: {{jurisdiction}}"), anchor: "Jurisdiction" },
  { type: "heading", level: 3, content: md("MNDA Modifications") },
  { type: "paragraph", content: field("modifications") },
  {
    type: "paragraph",
    content: md(
      "By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.",
    ),
  },
  {
    type: "table",
    columns: ["PARTY 1", "PARTY 2"],
    rows: [
      { label: "Signature", cells: [[], []] },
      partyRow("Print Name", "Name"),
      partyRow("Title", "Title"),
      partyRow("Company", "Company"),
      partyRow("Notice Address", "NoticeAddress"),
      { label: "Date", cells: [[], []] },
    ],
  },
  {
    type: "paragraph",
    content: md(
      "Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).",
    ),
  },
];

export const mutualNda: DocumentDefinition = {
  id: "mutual-nda",
  title: "Mutual Non-Disclosure Agreement",
  fileName: "Mutual-NDA.pdf",
  fields,
  sections: [
    { id: "cover-page", blocks: coverPage },
    { id: "standard-terms", template: "Mutual-NDA.md" },
  ],
};
