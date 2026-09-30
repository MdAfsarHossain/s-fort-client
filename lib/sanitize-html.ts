import DOMPurify from "dompurify";

// Sanitize once here (on paste/insert) and again defensively whenever the
// public site renders blog content — never trust a single sanitize pass at
// the edges of a system. Shared by the rich-text editor's raw HTML block and
// the Drag/Drop content builder's Custom HTML block.
export function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["srcdoc"],
  });
}
