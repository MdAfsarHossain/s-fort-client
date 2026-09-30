export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "button"
  | "customHtml";

interface BaseBlock {
  id: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  text: string;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  level: 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  alt: string;
}

export const DEFAULT_BUTTON_COLOR = "#4285F4";

export interface ButtonBlock extends BaseBlock {
  type: "button";
  text: string;
  href: string;
  color: string;
}

export interface CustomHtmlBlock extends BaseBlock {
  type: "customHtml";
  html: string;
}

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | ButtonBlock
  | CustomHtmlBlock;

// A named group of blocks. Sections render with visible spacing between them
// (see serializeBlocksToHtml) so the canvas and the published output both
// make it obvious where one group of content ends and the next begins.
export interface Section {
  id: string;
  blocks: ContentBlock[];
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  image: "Image",
  button: "Button",
  customHtml: "Custom HTML",
};

// Marks the wrapper element serializeBlocksToHtml produces so parseBlocksFromHtml
// can recognize blog content that was authored via the Drag/Drop tab and
// recover the original block list, rather than just the flattened HTML.
export const CONTENT_MODE_ATTR = "data-content-mode";
export const BLOCKS_DATA_ATTR = "data-blocks";

let blockIdCounter = 0;

// Client-only ids for React keys / dnd-kit — never sent to the backend.
function nextBlockId() {
  blockIdCounter += 1;
  return `block-${blockIdCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(type: BlockType): ContentBlock {
  const id = nextBlockId();
  switch (type) {
    case "paragraph":
      return { id, type, text: "" };
    case "heading":
      return { id, type, level: 2, text: "" };
    case "image":
      return { id, type, src: "", alt: "" };
    case "button":
      return { id, type, text: "", href: "", color: DEFAULT_BUTTON_COLOR };
    case "customHtml":
      return { id, type, html: "" };
  }
}

let sectionIdCounter = 0;

function nextSectionId() {
  sectionIdCounter += 1;
  return `section-${sectionIdCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSection(blocks: ContentBlock[] = []): Section {
  return { id: nextSectionId(), blocks };
}
