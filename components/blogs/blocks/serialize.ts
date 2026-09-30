import {
  BLOCKS_DATA_ATTR,
  CONTENT_MODE_ATTR,
  type ContentBlock,
  type Section,
} from "@/components/blogs/blocks/types";
import { sanitizeHtml } from "@/lib/sanitize-html";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Lets a form opt individual blog types (e.g. Portfolio) into a fixed inline
// typography treatment for headings/paragraphs without changing the default
// output other content types (e.g. Blog) already rely on.
export interface BlockStyleOptions {
  headingStyle?: string;
  paragraphStyle?: string;
}

function renderBlock(block: ContentBlock, styles?: BlockStyleOptions): string {
  switch (block.type) {
    case "paragraph":
      return block.text
        ? `<p${styles?.paragraphStyle ? ` style="${styles.paragraphStyle}"` : ""}>${escapeHtml(block.text)}</p>`
        : "";
    case "heading":
      return block.text
        ? `<h${block.level}${styles?.headingStyle ? ` style="${styles.headingStyle}"` : ""}>${escapeHtml(block.text)}</h${block.level}>`
        : "";
    case "image":
      return block.src
        ? `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" />`
        : "";
    case "button":
      return block.href
        ? `<a href="${escapeHtml(block.href)}" style="display:inline-block;padding:0.5rem 1rem;border-radius:0.375rem;background:${escapeHtml(block.color)};color:#fff;text-decoration:none;font-weight:500;">${escapeHtml(block.text)}</a>`
        : "";
    case "customHtml":
      return block.html ? sanitizeHtml(block.html) : "";
  }
}

// Renders the section list to the same HTML shape the rich-text tab produces,
// since both tabs ultimately feed the blog's single `content` field. Each
// section is wrapped in its own <section>, with an inline margin/border on
// every section but the last — inline so the gap survives wherever this HTML
// ends up rendered, not just inside this app's Tailwind-styled preview. The
// outer wrapper also carries the original section list (URL-encoded, so the
// double-quoted attribute stays well-formed) so parseBlocksFromHtml can
// reconstruct the Drag/Drop canvas exactly when this item is edited again —
// without needing a separate backend field for it.
export function serializeBlocksToHtml(
  sections: Section[],
  styles?: BlockStyleOptions,
): string {
  const renderedSections = sections
    .map((section) => ({
      id: section.id,
      inner: section.blocks
        .map((block) => renderBlock(block, styles))
        .filter(Boolean)
        .join("\n"),
    }))
    .filter((section) => section.inner);

  const sectionsHtml = renderedSections
    .map(({ id, inner }, index) => {
      const isLast = index === renderedSections.length - 1;
      const style = isLast
        ? ""
        : ' style="margin-bottom:2rem;padding-bottom:2rem;border-bottom:0px solid rgba(128,128,128,0.25);"';
      return `<section data-scrumfort-section="${escapeHtml(id)}"${style}>\n${inner}\n</section>`;
    })
    .join("\n");

  const encodedSections = encodeURIComponent(JSON.stringify(sections));
  return `<div ${CONTENT_MODE_ATTR}="blocks" ${BLOCKS_DATA_ATTR}="${encodedSections}">\n${sectionsHtml}\n</div>`;
}
