import {
  BLOCKS_DATA_ATTR,
  CONTENT_MODE_ATTR,
  DEFAULT_BUTTON_COLOR,
  type ContentBlock,
  type Section,
} from "@/components/blogs/blocks/types";

function isValidBlock(value: unknown): value is ContentBlock {
  if (typeof value !== "object" || value === null) return false;
  const block = value as Record<string, unknown>;
  if (typeof block.id !== "string") return false;

  switch (block.type) {
    case "paragraph":
      return typeof block.text === "string";
    case "heading":
      return (
        (block.level === 2 || block.level === 3 || block.level === 4) &&
        typeof block.text === "string"
      );
    case "image":
      return typeof block.src === "string" && typeof block.alt === "string";
    case "button":
      // `color` is optional here for blogs saved before it existed —
      // normalizeBlock backfills a default for those below.
      return (
        typeof block.text === "string" &&
        typeof block.href === "string" &&
        (block.color === undefined || typeof block.color === "string")
      );
    case "customHtml":
      return typeof block.html === "string";
    default:
      return false;
  }
}

function normalizeBlock(block: ContentBlock): ContentBlock {
  if (block.type === "button" && typeof block.color !== "string") {
    return { ...block, color: DEFAULT_BUTTON_COLOR };
  }
  return block;
}

function isValidSection(value: unknown): value is Section {
  if (typeof value !== "object" || value === null) return false;
  const section = value as Record<string, unknown>;
  return (
    typeof section.id === "string" &&
    Array.isArray(section.blocks) &&
    section.blocks.every(isValidBlock)
  );
}

// Detects whether `html` was produced by serializeBlocksToHtml and, if so,
// recovers the original section list — so editing a Drag/Drop-authored blog
// repopulates the canvas instead of showing an empty one. Returns null for
// anything else (plain rich-text content, or content predating this feature).
export function parseBlocksFromHtml(html: string): Section[] | null {
  if (typeof window === "undefined" || !html) return null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const marker = doc.querySelector(
    `[${CONTENT_MODE_ATTR}="blocks"][${BLOCKS_DATA_ATTR}]`
  );
  const raw = marker?.getAttribute(BLOCKS_DATA_ATTR);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));

    // Current format: an array of sections.
    if (Array.isArray(parsed) && parsed.every(isValidSection)) {
      return parsed.map((section) => ({
        ...section,
        blocks: section.blocks.map(normalizeBlock),
      }));
    }

    // Legacy format, predating sections: a flat block list. Wrap it in a
    // single section so content saved before this feature still opens with
    // its blocks intact.
    if (Array.isArray(parsed) && parsed.every(isValidBlock)) {
      return [{ id: "section-legacy", blocks: parsed.map(normalizeBlock) }];
    }

    return null;
  } catch {
    return null;
  }
}
