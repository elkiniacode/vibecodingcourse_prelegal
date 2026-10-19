import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Fragment, type ReactNode } from "react";
import { createFieldResolver, type FieldResolver } from "@/lib/engine/fields";
import {
  anchorId,
  type Block,
  type DocumentModel,
  type FieldValues,
  type Inline,
} from "@/lib/engine/model";

// Brand colors from CLAUDE.md, matching the @theme tokens in globals.css
const NAVY = "#032147";
const BLUE = "#209dd7";
const RULE = "#999999";
const BLANK = "________________";

/**
 * Keeps ordinary words whole so legal text isn't hyphenated, but lets very long
 * tokens such as email addresses wrap instead of overflowing table cells.
 * react-pdf inserts a hyphen wherever it breaks a word.
 */
export function breakLongWords(word: string): string[] {
  return word.length > 24 ? (word.match(/.{1,8}/g) ?? [word]) : [word];
}

Font.registerHyphenationCallback(breakLongWords);

// Built-in PDF fonts only, so generating a PDF never needs a network request
const styles = StyleSheet.create({
  page: {
    paddingVertical: 56,
    paddingHorizontal: 64,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.45,
    color: "#111111",
  },
  h1: { fontFamily: "Times-Bold", fontSize: 18, color: NAVY, textAlign: "center", marginBottom: 14 },
  h2: { fontFamily: "Times-Bold", fontSize: 11, color: NAVY, marginTop: 6, marginBottom: 6 },
  h3: { fontFamily: "Times-Bold", fontSize: 12, color: NAVY, marginTop: 12, marginBottom: 4 },
  paragraph: { marginBottom: 6 },
  strong: { fontFamily: "Times-Bold" },
  link: { color: BLUE, textDecoration: "underline" },
  term: { fontFamily: "Times-Bold", color: NAVY, textDecoration: "none" },
  listItem: { flexDirection: "row", marginBottom: 7 },
  listMarker: { width: 20 },
  grow: { flex: 1 },
  option: { flexDirection: "row", marginBottom: 4 },
  checkbox: {
    width: 9,
    height: 9,
    marginTop: 3,
    marginRight: 7,
    borderWidth: 1,
    borderColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: { fontFamily: "Helvetica-Bold", fontSize: 7, lineHeight: 1 },
  table: { marginVertical: 12, borderWidth: 1, borderColor: RULE },
  row: { flexDirection: "row", borderTopWidth: 1, borderColor: RULE },
  labelCell: { width: "26%", padding: 6, fontFamily: "Times-Bold" },
  cell: { width: "37%", minHeight: 30, padding: 6, borderLeftWidth: 1, borderColor: RULE },
});

interface DocumentPdfProps {
  model: DocumentModel;
  values: FieldValues;
}

/** PDF rendering of a document model; walks the same blocks as the HTML preview. */
export function DocumentPdf({ model, values }: DocumentPdfProps) {
  const resolve = createFieldResolver(model.fields, values);

  return (
    <Document title={model.title} creator="Prelegal" producer="Prelegal">
      {model.sections.map((section) => (
        <Page key={section.id} size="LETTER" style={styles.page}>
          {section.blocks.map((block, index) => (
            <PdfBlock key={index} block={block} values={values} resolve={resolve} />
          ))}
        </Page>
      ))}
    </Document>
  );
}

const HEADING_STYLES = { 1: styles.h1, 2: styles.h2, 3: styles.h3 };

interface PdfBlockProps {
  block: Block;
  values: FieldValues;
  resolve: FieldResolver;
}

function PdfBlock({ block, values, resolve }: PdfBlockProps) {
  const inlines = (content: Inline[]) => renderInlines(content, resolve);

  switch (block.type) {
    case "heading":
      return (
        <Text
          id={block.anchor && anchorId(block.anchor)}
          style={HEADING_STYLES[block.level]}
          minPresenceAhead={40}
        >
          {inlines(block.content)}
        </Text>
      );
    case "paragraph":
      return (
        <Text id={block.anchor && anchorId(block.anchor)} style={styles.paragraph}>
          {inlines(block.content)}
        </Text>
      );
    case "list":
      return (
        <View>
          {block.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listMarker}>{block.ordered ? `${block.start + index}.` : "•"}</Text>
              <Text style={styles.grow}>{inlines(item)}</Text>
            </View>
          ))}
        </View>
      );
    case "options":
      return (
        <View>
          {block.options.map((option) => (
            <View key={option.value} style={styles.option}>
              <View style={styles.checkbox}>
                {values[block.fieldId] === option.value && <Text style={styles.checkmark}>X</Text>}
              </View>
              <Text style={styles.grow}>{inlines(option.content)}</Text>
            </View>
          ))}
        </View>
      );
    case "table":
      return (
        <View style={styles.table} wrap={false}>
          <View style={[styles.row, { borderTopWidth: 0 }]}>
            <Text style={styles.labelCell} />
            {block.columns.map((column) => (
              <Text key={column} style={[styles.cell, styles.strong]}>
                {column}
              </Text>
            ))}
          </View>
          {block.rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.labelCell}>{row.label}</Text>
              {row.cells.map((cell, index) => (
                <Text key={index} style={styles.cell}>
                  {inlines(cell)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
  }
}

function renderInlines(content: Inline[], resolve: FieldResolver): ReactNode {
  return content.map((inline, index) => (
    <Fragment key={index}>{renderInline(inline, resolve)}</Fragment>
  ));
}

function renderInline(inline: Inline, resolve: FieldResolver): ReactNode {
  switch (inline.type) {
    case "text":
      return inline.text;
    case "strong":
      return <Text style={styles.strong}>{inline.text}</Text>;
    case "link":
      return (
        <Link src={inline.href} style={styles.link}>
          {inline.text}
        </Link>
      );
    case "term":
      return (
        <Link src={`#${anchorId(inline.text)}`} style={styles.term}>
          {inline.text}
        </Link>
      );
    case "field": {
      const value = resolve(inline.fieldId);
      return value.filled ? value.text : BLANK;
    }
  }
}
