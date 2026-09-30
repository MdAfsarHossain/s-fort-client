import { Node as TiptapNode } from "@tiptap/core";

import { sanitizeHtml } from "@/lib/sanitize-html";

const MARKER_ATTR = "data-raw-html-block";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    rawHtmlBlock: {
      insertRawHtmlBlock: (html: string) => ReturnType;
    };
  }
}

// An opaque block for pasted HTML/CSS the current schema has no nodes for
// (raw divs, inline styles, gradients, flex layouts, etc.). Stored and
// rendered verbatim (post-sanitization) rather than parsed into paragraphs,
// headings, and marks like normal pasted content.
export const RawHtmlBlock = TiptapNode.create({
  name: "rawHtmlBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      html: {
        default: "",
        parseHTML: (element) => element.innerHTML,
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[${MARKER_ATTR}]` }];
  },

  renderHTML({ node }) {
    const wrapper = document.createElement("div");
    wrapper.setAttribute(MARKER_ATTR, "true");
    wrapper.innerHTML = sanitizeHtml(node.attrs.html as string);
    return wrapper;
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      // No contentDOM (this node has no editable ProseMirror content), so
      // the browser must be told explicitly not to treat this region as
      // part of the surrounding contenteditable — otherwise clicks place a
      // native cursor inside `pre`'s text instead of creating a proper
      // NodeSelection, and typed characters get silently reverted the
      // moment ProseMirror notices a DOM mutation it doesn't recognize.
      const dom = document.createElement("div");
      dom.contentEditable = "false";
      dom.className =
        "my-3 overflow-hidden rounded-md border border-dashed border-border bg-muted/30";

      const header = document.createElement("div");
      header.className =
        "flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-2.5 py-1";

      const label = document.createElement("span");
      label.className = "text-[11px] font-medium text-muted-foreground";
      label.textContent = "Custom HTML block (renders on publish)";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.className =
        "rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground";

      header.append(label, editButton);

      const pre = document.createElement("pre");
      pre.className =
        "max-h-64 overflow-auto px-3 py-2 text-xs whitespace-pre-wrap break-all text-muted-foreground [overflow-wrap:anywhere]";
      pre.textContent = node.attrs.html as string;

      const textarea = document.createElement("textarea");
      textarea.className =
        "block max-h-64 min-h-32 w-full resize-y bg-transparent px-3 py-2 font-mono text-xs text-foreground outline-none";
      textarea.value = node.attrs.html as string;
      textarea.style.display = "none";

      let isEditing = false;

      function commitEdit() {
        const pos = getPos();
        if (typeof pos !== "number") return;
        editor.view.dispatch(
          editor.view.state.tr.setNodeAttribute(pos, "html", textarea.value)
        );
      }

      function setEditing(next: boolean) {
        isEditing = next;
        pre.style.display = next ? "none" : "block";
        textarea.style.display = next ? "block" : "none";
        editButton.textContent = next ? "Done" : "Edit";

        if (next) {
          textarea.value = node.attrs.html as string;
          textarea.focus();
        } else {
          commitEdit();
        }
      }

      editButton.addEventListener("click", (event) => {
        event.preventDefault();
        setEditing(!isEditing);
      });

      dom.append(header, pre, textarea);

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== node.type.name) return false;
          if (!isEditing) {
            pre.textContent = updatedNode.attrs.html as string;
          }
          return true;
        },
        // Let the textarea/button handle their own events (typing,
        // clicking) natively instead of ProseMirror intercepting them —
        // this node has no contentDOM for ProseMirror to manage.
        stopEvent(event) {
          const target = event.target as Node | null;
          return Boolean(
            target && (textarea.contains(target) || editButton.contains(target))
          );
        },
        ignoreMutation() {
          return true;
        },
        selectNode() {
          dom.classList.add("ring-2", "ring-primary");
        },
        deselectNode() {
          dom.classList.remove("ring-2", "ring-primary");
        },
      };
    };
  },

  addCommands() {
    return {
      insertRawHtmlBlock:
        (html: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { html },
          }),
    };
  },
});
