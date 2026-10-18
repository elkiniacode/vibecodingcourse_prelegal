import type { Block, Inline } from "./model";

const HEADING = /^(#{1,6})\s+(.*)$/;
const LIST_ITEM = /^(?:(\d+)\.|[-*])\s+(.*)$/;
const INLINE_TOKEN =
  /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|<span class="[a-z]+_link">(.+?)<\/span>|\{\{(\w+)\}\}/g;
const HTML_TAG = /<\/?[a-z][^>]*>/gi;

/**
 * Parses the markdown subset the CommonPaper templates use so far: headings,
 * paragraphs, flat ordered or bullet lists (items may be separated by blank
 * lines) and the inline syntax handled by parseInline.
 */
export function parseTemplate(markdown: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; start: number; items: string[] } | null = null;
  let previousLineBlank = true;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: "paragraph", content: parseInline(paragraph.join(" ")) });
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const { ordered, start, items } = list;
    blocks.push({ type: "list", ordered, start, items: items.map(parseInline) });
    list = null;
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      previousLineBlank = true;
      continue;
    }

    const heading = HEADING.exec(line);
    const item = LIST_ITEM.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length, 3) as 1 | 2 | 3;
      blocks.push({ type: "heading", level, content: parseInline(heading[2]) });
    } else if (item) {
      flushParagraph();
      const ordered = item[1] !== undefined;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, start: ordered ? Number(item[1]) : 1, items: [] };
      }
      list.items.push(item[2]);
    } else if (list && !previousLineBlank) {
      // A line directly under a list item continues that item
      list.items[list.items.length - 1] += ` ${line}`;
    } else {
      flushList();
      paragraph.push(line);
    }
    previousLineBlank = false;
  }

  flushParagraph();
  flushList();
  return blocks;
}

/**
 * Parses **bold**, [links](url), <span class="*_link">Term</span> references to
 * defined terms, and {{fieldId}} placeholders for form values (used by content
 * written in code). Any other HTML tag is dropped and its text kept.
 */
export function parseInline(source: string): Inline[] {
  const inlines: Inline[] = [];
  let lastIndex = 0;
  for (const match of source.matchAll(INLINE_TOKEN)) {
    pushText(inlines, source.slice(lastIndex, match.index));
    const [, strong, linkText, href, term, fieldId] = match;
    if (strong !== undefined) inlines.push({ type: "strong", text: stripTags(strong) });
    else if (linkText !== undefined) inlines.push({ type: "link", text: linkText, href });
    else if (term !== undefined) inlines.push({ type: "term", text: stripTags(term) });
    else inlines.push({ type: "field", fieldId });
    lastIndex = match.index + match[0].length;
  }
  pushText(inlines, source.slice(lastIndex));
  return inlines;
}

function pushText(inlines: Inline[], text: string) {
  const clean = stripTags(text);
  if (clean) inlines.push({ type: "text", text: clean });
}

function stripTags(text: string): string {
  return text.replace(HTML_TAG, "");
}
