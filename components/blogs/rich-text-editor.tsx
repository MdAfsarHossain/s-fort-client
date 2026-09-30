"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  Undo2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RawHtmlBlock } from "@/components/blogs/raw-html-block";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Tags the current schema (StarterKit's paragraphs/headings/marks/lists) has
// no representation for. Pasted markup containing any of these — or an
// inline `style=` attribute — is treated as an opaque raw HTML block instead
// of being parsed into the schema, since parsing would silently drop the
// divs/layout/styling that make up the content.
const STRUCTURAL_HTML_PATTERN =
  /<(div|span|table|thead|tbody|tr|td|th|section|article|header|footer|nav|aside|style|button|img|iframe|form|input|select|textarea)\b|style\s*=/i;

function ToolbarButton({
  active,
  ...props
}: React.ComponentProps<typeof Button> & { active?: boolean }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      {...props}
    />
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, RawHtmlBlock],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "h-[420px] w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-b-md px-3 py-2 text-sm break-words [overflow-wrap:anywhere] focus:outline-none",
          "[&_p]:mb-1.5 [&_p:last-child]:mb-0",
          "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2:first-child]:mt-0",
          "[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3:first-child]:mt-0",
          "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_blockquote]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs",
          "[&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:text-muted-foreground [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
        ),
        "data-placeholder": placeholder ?? "",
      },
      // Clipboard data copied from a code editor/plain text file carries raw
      // tag syntax in text/plain, but browsers often also synthesize a
      // text/html entry that's just that same text HTML-escaped (not real
      // markup) — so text/html can't be trusted to detect "genuine" rich
      // content here. Check text/plain for tag syntax instead.
      handlePaste: (_view, event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData("text/plain");
        if (!text || !/<\/?[a-z][\s\S]*>/i.test(text)) return false;

        event.preventDefault();

        // Divs/tables/inline styles etc. have no home in this schema —
        // parsing them would drop all the layout/styling. Keep them as an
        // opaque, sanitized raw HTML block instead of mangling them into
        // paragraphs.
        if (STRUCTURAL_HTML_PATTERN.test(text)) {
          editor?.chain().focus().insertRawHtmlBlock(text).run();
          return true;
        }

        // Otherwise it's simple inline markup (<strong>, <em>, <h2>, ...) —
        // parse it through the schema like normal formatted content.
        editor?.chain().focus().insertContent(text).run();
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep the editor in sync when a different blog's content loads asynchronously.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-md border">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon />
          <span className="sr-only">Bold</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon />
          <span className="sr-only">Italic</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikethroughIcon />
          <span className="sr-only">Strikethrough</span>
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2Icon />
          <span className="sr-only">Heading 2</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3Icon />
          <span className="sr-only">Heading 3</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 4 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
        >
          <Heading4Icon />
          <span className="sr-only">Heading 4</span>
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon />
          <span className="sr-only">Bullet list</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon />
          <span className="sr-only">Numbered list</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon />
          <span className="sr-only">Quote</span>
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2Icon />
          <span className="sr-only">Undo</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2Icon />
          <span className="sr-only">Redo</span>
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
