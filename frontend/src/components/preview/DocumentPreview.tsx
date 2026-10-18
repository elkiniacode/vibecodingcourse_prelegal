import { Fragment, type ReactNode } from "react";
import { createFieldResolver, type FieldResolver } from "@/lib/engine/fields";
import {
  anchorId,
  type Block,
  type DocumentModel,
  type FieldValues,
  type Inline,
} from "@/lib/engine/model";

interface DocumentPreviewProps {
  model: DocumentModel;
  values: FieldValues;
}

/** HTML rendering of a document model; user values are only ever rendered as text. */
export function DocumentPreview({ model, values }: DocumentPreviewProps) {
  const resolve = createFieldResolver(model.fields, values);

  return (
    <article
      aria-label={model.title}
      className="mx-auto max-w-3xl rounded-lg bg-white px-6 py-10 font-serif text-[15px] leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-200 sm:px-14 sm:py-14"
    >
      {model.sections.map((section, index) => (
        <section
          key={section.id}
          className={index > 0 ? "mt-14 border-t border-slate-200 pt-12" : undefined}
        >
          {section.blocks.map((block, blockIndex) => (
            <PreviewBlock key={blockIndex} block={block} values={values} resolve={resolve} />
          ))}
        </section>
      ))}
    </article>
  );
}

// Document headings sit one level below the page's own h1
const HEADING_TAGS = { 1: "h2", 2: "h3", 3: "h4" } as const;
const HEADING_STYLES = {
  1: "mb-6 text-center text-2xl font-bold text-navy",
  2: "mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-navy",
  3: "mb-2 mt-6 font-bold text-navy",
};
const ANCHOR_TARGET = "scroll-mt-6 rounded target:bg-accent/20 target:ring-4 target:ring-accent/20";

interface PreviewBlockProps {
  block: Block;
  values: FieldValues;
  resolve: FieldResolver;
}

function PreviewBlock({ block, values, resolve }: PreviewBlockProps) {
  const inlines = (content: Inline[]) => renderInlines(content, resolve);

  switch (block.type) {
    case "heading": {
      const Heading = HEADING_TAGS[block.level];
      return (
        <Heading
          id={block.anchor && anchorId(block.anchor)}
          className={`${HEADING_STYLES[block.level]} ${block.anchor ? ANCHOR_TARGET : ""}`}
        >
          {inlines(block.content)}
        </Heading>
      );
    }
    case "paragraph":
      return (
        <p
          id={block.anchor && anchorId(block.anchor)}
          className={`my-3 ${block.anchor ? ANCHOR_TARGET : ""}`}
        >
          {inlines(block.content)}
        </p>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List
          start={block.ordered ? block.start : undefined}
          className={`my-4 space-y-3 pl-6 ${block.ordered ? "list-decimal" : "list-disc"}`}
        >
          {block.items.map((item, index) => (
            <li key={index} className="pl-1">
              {inlines(item)}
            </li>
          ))}
        </List>
      );
    }
    case "options":
      return (
        <ul className="my-3 space-y-2">
          {block.options.map((option) => {
            const selected = values[block.fieldId] === option.value;
            return (
              <li key={option.value} className={`flex gap-3 ${selected ? "" : "text-slate-500"}`}>
                <span
                  aria-hidden
                  className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-sm border text-[11px] font-bold ${selected ? "border-navy bg-navy text-white" : "border-slate-300"}`}
                >
                  {selected ? "✓" : ""}
                </span>
                <span>
                  <span className="sr-only">{selected ? "Selected: " : "Not selected: "}</span>
                  {inlines(option.content)}
                </span>
              </li>
            );
          })}
        </ul>
      );
    case "table":
      return (
        <table className="my-8 w-full table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <td className="w-1/4" />
              {block.columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="border-b-2 border-navy px-3 py-2 text-left font-bold text-navy"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-200">
                <th scope="row" className="py-3 pr-3 text-left align-top font-semibold text-slate-600">
                  {row.label}
                </th>
                {row.cells.map((cell, index) => (
                  <td key={index} className="break-words px-3 py-3 align-top">
                    {cell.length > 0 ? inlines(cell) : <span className="block h-6" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
      return <strong className="font-bold">{inline.text}</strong>;
    case "link":
      return (
        <a
          href={inline.href}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-2 hover:text-navy"
        >
          {inline.text}
        </a>
      );
    case "term":
      return (
        <a
          href={`#${anchorId(inline.text)}`}
          className="font-semibold text-navy underline decoration-primary decoration-dotted underline-offset-4 hover:decoration-solid"
        >
          {inline.text}
        </a>
      );
    case "field": {
      const value = resolve(inline.fieldId);
      return value.filled ? (
        <span data-field={inline.fieldId} className="whitespace-pre-line rounded bg-primary/10 px-0.5 text-navy">
          {value.text}
        </span>
      ) : (
        <mark data-field={inline.fieldId} className="rounded bg-accent/25 px-1 text-slate-600">
          [{value.label}]
        </mark>
      );
    }
  }
}
