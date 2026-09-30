"use client";

import { useState, type SubmitEvent } from "react";
import { LayoutGridIcon, Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { BlockContentEditor } from "@/components/blogs/block-content-editor";
import { createSection, type Section } from "@/components/blogs/blocks/types";
import { parseBlocksFromHtml } from "@/components/blogs/blocks/parse";
import {
  serializeBlocksToHtml,
  type BlockStyleOptions,
} from "@/components/blogs/blocks/serialize";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/blogs/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreatePortfolioMutation,
  useUpdatePortfolioMutation,
  useUploadPortfolioImageMutation,
  type Portfolio,
  type PortfolioFormFields,
  type PortfolioStatus,
  type PortfolioType,
  type PortfolioVisibility,
} from "@/redux/api/portfolioApi";

// Fixed typography for Portfolio's Drag/Drop heading and paragraph blocks —
// scoped to Portfolio only via serializeBlocksToHtml's style param, so Blog's
// output (which shares the same serializer) is unaffected.
const PORTFOLIO_BLOCK_STYLES: BlockStyleOptions = {
  headingStyle:
    "color:#000;font-family:'Stack Sans Notch';font-size:28px;font-style:normal;font-weight:400;line-height:110%;letter-spacing:-0.96px;",
  paragraphStyle:
    "color:#000;font-family:'Fragment Mono';font-size:16px;font-style:normal;font-weight:400;line-height:36px;letter-spacing:-0.6px;",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "PORTFOLIO" as PortfolioType,
  client: "",
  industry: "",
  duration: "",
  technologies: "",
  content: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  visibility: "PUBLIC" as PortfolioVisibility,
  status: "DRAFT" as PortfolioStatus,
};

// Only the update endpoint expects a true partial body — diff against the
// originally loaded portfolio item so untouched fields (e.g. content,
// seo_keywords) aren't resent and don't trip the backend's stricter update
// validation.
function diffPortfolioFields(
  original: Portfolio,
  next: PortfolioFormFields
): Partial<PortfolioFormFields> {
  const diff: Partial<PortfolioFormFields> = {};

  if (next.title !== original.title) diff.title = next.title;
  if (next.description !== original.description)
    diff.description = next.description;
  if (next.type !== original.type) diff.type = next.type;
  if (next.client !== (original.client ?? "")) diff.client = next.client;
  if (next.industry !== (original.industry ?? ""))
    diff.industry = next.industry;
  if (next.duration !== (original.duration ?? ""))
    diff.duration = next.duration;
  if (
    JSON.stringify(next.technologies) !== JSON.stringify(original.technologies)
  ) {
    diff.technologies = next.technologies;
  }
  if (next.content !== original.content) diff.content = next.content;
  if (next.seo_title !== original.seo_title) diff.seo_title = next.seo_title;
  if (next.seo_description !== original.seo_description)
    diff.seo_description = next.seo_description;
  if (
    JSON.stringify(next.seo_keywords) !== JSON.stringify(original.seo_keywords)
  ) {
    diff.seo_keywords = next.seo_keywords;
  }
  if (next.visibility !== original.visibility)
    diff.visibility = next.visibility;
  if (next.status !== original.status) diff.status = next.status;

  return diff;
}

function toFormState(portfolio?: Portfolio | null) {
  if (!portfolio) return EMPTY_FORM;

  // A blocks-authored item's `content` is the Drag/Drop drawer's data —
  // showing that same (degraded, wrapper-and-all) HTML in the rich-text
  // editor too would duplicate it across both editors. Keep them separate:
  // rich-text starts blank here, and blocks are recovered separately below.
  const isBlocksAuthored = !!parseBlocksFromHtml(portfolio.content);

  return {
    title: portfolio.title,
    description: portfolio.description,
    type: portfolio.type,
    client: portfolio.client ?? "",
    industry: portfolio.industry ?? "",
    duration: portfolio.duration ?? "",
    technologies: portfolio.technologies.join(", "),
    content: isBlocksAuthored ? "" : portfolio.content,
    seoTitle: portfolio.seo_title,
    seoDescription: portfolio.seo_description,
    seoKeywords: portfolio.seo_keywords.join(", "),
    visibility: portfolio.visibility,
    status: portfolio.status,
  };
}

export function PortfolioForm({
  portfolio,
  onSaved,
  onCancel,
}: {
  portfolio?: Portfolio | null;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const isEditing = !!portfolio;
  const [form, setForm] = useState(() => toFormState(portfolio));
  // A portfolio item authored via the Drag/Drop drawer has its section/block
  // list encoded inside its own `content` HTML (see serializeBlocksToHtml) —
  // recover it here so editing repopulates the canvas instead of starting
  // empty. Whenever any section has blocks, they take precedence over the
  // rich-text content at submit time (see handleSubmit) — no separate
  // "active mode" needed. Always keep at least one section so there's
  // somewhere to drop a block immediately.
  const [sections, setSections] = useState<Section[]>(
    () => (portfolio && parseBlocksFromHtml(portfolio.content)) || [
      createSection(),
    ]
  );
  const totalBlockCount = sections.reduce(
    (sum, section) => sum + section.blocks.length,
    0
  );
  const [blockDrawerOpen, setBlockDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"edit" | "preview">("edit");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const originalImageUrls = portfolio?.featured_image ?? [];
  const [keptImageUrls, setKeptImageUrls] = useState<string[]>(
    () => originalImageUrls
  );
  const [createPortfolio, { isLoading: isCreating }] =
    useCreatePortfolioMutation();
  const [updatePortfolio, { isLoading: isUpdating }] =
    useUpdatePortfolioMutation();
  const [uploadPortfolioImage] = useUploadPortfolioImageMutation();
  const isSubmitting = isCreating || isUpdating;

  function removeExistingImage(url: string) {
    setKeptImageUrls((prev) => prev.filter((kept) => kept !== url));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    // Both editors feed this single field — sections take precedence once any
    // have blocks, otherwise the rich-text content is used.
    const content =
      totalBlockCount > 0
        ? serializeBlocksToHtml(sections, PORTFOLIO_BLOCK_STYLES)
        : form.content;

    const fullFields: PortfolioFormFields = {
      title: form.title,
      description: form.description,
      type: form.type,
      client: form.client,
      industry: form.industry,
      duration: form.duration,
      technologies: form.technologies
        .split(",")
        .map((tech) => tech.trim())
        .filter(Boolean),
      content,
      seo_title: form.seoTitle,
      seo_description: form.seoDescription,
      seo_keywords: form.seoKeywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      visibility: form.visibility,
      status: form.status,
    };
    const hasNewImages = images.length > 0;
    const imagesChanged =
      hasNewImages ||
      JSON.stringify(keptImageUrls) !== JSON.stringify(originalImageUrls);

    try {
      if (isEditing && portfolio) {
        const fields: Partial<PortfolioFormFields> & {
          urlsToSave?: string[];
        } = diffPortfolioFields(portfolio, fullFields);
        if (imagesChanged) {
          fields.urlsToSave = keptImageUrls;
        }
        if (Object.keys(fields).length === 0 && !hasNewImages) {
          onSaved();
          return;
        }
        await updatePortfolio({
          id: portfolio.id,
          fields,
          images: hasNewImages ? images : undefined,
        }).unwrap();
        toast.success("Portfolio item updated");
      } else {
        await createPortfolio({
          fields: fullFields,
          images: hasNewImages ? images : undefined,
        }).unwrap();
        toast.success("Portfolio item created");
      }
      onSaved();
    } catch {
      toast.error(
        isEditing
          ? "Failed to update portfolio item"
          : "Failed to create portfolio item"
      );
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Basic info
        </h3>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="portfolio-title">Title</Label>
          <Input
            id="portfolio-title"
            required
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
          />
        </div>
            <div className="flex flex-col gap-1.5">
          <Label htmlFor="portfolio-description">Description</Label>
          <Textarea
            id="portfolio-description"
            required
            placeholder="Short summary shown in listings"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="portfolio-type">Type</Label>
          <Select
            value={form.type}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, type: value as PortfolioType }))
            }
          >
            <SelectTrigger id="portfolio-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PORTFOLIO">Portfolio</SelectItem>
              <SelectItem value="CASE_STUDY">Case study</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="portfolio-client">Client</Label>
            <Input
              id="portfolio-client"
              value={form.client}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, client: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="portfolio-industry">Industry</Label>
            <Input
              id="portfolio-industry"
              value={form.industry}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, industry: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="portfolio-duration">Duration</Label>
          <Input
            id="portfolio-duration"
            placeholder="e.g. 3 months"
            value={form.duration}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, duration: event.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="portfolio-technologies">Technologies</Label>
          <Input
            id="portfolio-technologies"
            placeholder="React, Node.js, PostgreSQL"
            value={form.technologies}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                technologies: event.target.value,
              }))
            }
          />
        </div>
        {/* <div className="flex flex-col gap-1.5">
          <Label htmlFor="portfolio-description">Description</Label>
          <Textarea
            id="portfolio-description"
            required
            placeholder="Short summary shown in listings"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </div> */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="portfolio-featured-image">Featured images</Label>
          {isEditing && keptImageUrls.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {keptImageUrls.map((url) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external URLs from the backend, not a local/optimizable asset */}
                  <img
                    src={url}
                    alt=""
                    onClick={() => setPreviewUrl(url)}
                    className="h-28 w-28 cursor-pointer rounded-lg object-cover ring-1 ring-border transition hover:opacity-90 sm:h-48 sm:w-56"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    className="absolute -top-2 -right-2 rounded-full bg-destructive text-white shadow-sm ring-2 ring-background hover:bg-destructive/90"
                    onClick={() => removeExistingImage(url)}
                  >
                    <XIcon />
                    <span className="sr-only">Remove image</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Input
            id="portfolio-featured-image"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) =>
              setImages(Array.from(event.target.files ?? []))
            }
          />
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((file, index) => {
                const objectUrl = URL.createObjectURL(file);
                return (
                  <div key={`${file.name}-${index}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview of a freshly picked file */}
                    <img
                      src={objectUrl}
                      alt=""
                      onClick={() => setPreviewUrl(objectUrl)}
                      className="h-28 w-28 cursor-pointer rounded-lg object-cover ring-1 ring-border transition hover:opacity-90 sm:h-40 sm:w-40"
                    />
                  </div>
                );
              })}
            </div>
          )}
          {isEditing && (
            <p className="text-xs text-muted-foreground">
              Remove images above or add new ones. Leave both untouched to
              keep everything as-is.
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-1.5 md:max-w-[82.5vw] max-w-[84vw]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Content
          </h3>
          {/* Drag/Drop is a mouse-driven, palette-and-canvas builder that
              doesn't translate to touch — hidden below sm rather than shown
              in a cramped, hard-to-use form. */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => setBlockDrawerOpen(true)}
          >
            <LayoutGridIcon />
            Drag/Drop Content
            {totalBlockCount > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-xs text-primary">
                {totalBlockCount}
              </span>
            )}
          </Button>
        </div>
        <RichTextEditor
          value={form.content}
          onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
          placeholder="Write the project details..."
        />
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-muted-foreground">SEO</h3>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="portfolio-seo-title">SEO title</Label>
          <Input
            id="portfolio-seo-title"
            required
            value={form.seoTitle}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, seoTitle: event.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="portfolio-seo-description">SEO description</Label>
          <Textarea
            id="portfolio-seo-description"
            required
            value={form.seoDescription}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                seoDescription: event.target.value,
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="portfolio-seo-keywords">SEO keywords</Label>
          <Input
            id="portfolio-seo-keywords"
            placeholder="keyword1, keyword2"
            value={form.seoKeywords}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                seoKeywords: event.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Publishing
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="portfolio-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as PortfolioStatus,
                }))
              }
            >
              <SelectTrigger id="portfolio-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="portfolio-visibility">Visibility</Label>
            <Select
              value={form.visibility}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  visibility: value as PortfolioVisibility,
                }))
              }
            >
              <SelectTrigger id="portfolio-visibility" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          {isEditing ? "Save changes" : "Create portfolio item"}
        </Button>
      </div>

      <Dialog
        open={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">Featured image preview</DialogTitle>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- full-size preview of an already-loaded thumbnail (external URL or local object URL)
            <img
              src={previewUrl}
              alt=""
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={blockDrawerOpen} onOpenChange={setBlockDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full data-[side=right]:sm:max-w-2xl"
        >
          <SheetHeader className="border-b">
            <SheetTitle>Drag &amp; Drop Content</SheetTitle>
          </SheetHeader>
          <Tabs
            value={drawerTab}
            onValueChange={(value) => setDrawerTab(value as "edit" | "preview")}
            className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4"
          >
            <TabsList className="w-full">
              <TabsTrigger value="edit" className="flex-1">
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1">
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="min-h-0 flex-1 overflow-y-auto">
              <BlockContentEditor
                sections={sections}
                onChange={setSections}
                uploadImage={(file) => uploadPortfolioImage(file).unwrap()}
              />
            </TabsContent>
            <TabsContent
              value="preview"
              className="min-h-0 flex-1 overflow-y-auto"
            >
              {totalBlockCount === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No blocks yet — switch to Edit to add some.
                </p>
              ) : (
                <div
                  className="rounded-md border bg-white p-4 text-sm [&_h2]:mb-2 [&_h2]:mt-4 [&_h2:first-child]:mt-0 [&_h3]:mb-2 [&_h3]:mt-3 [&_h4]:mb-1.5 [&_h4]:mt-2 [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-md [&_p]:mb-3 [&_p:last-child]:mb-0"
                  // Safe: every block's text/attrs is HTML-escaped by
                  // serializeBlocksToHtml before being interpolated. bg-white
                  // keeps the forced-black heading/paragraph text legible
                  // regardless of the dashboard's dark/light theme.
                  dangerouslySetInnerHTML={{
                    __html: serializeBlocksToHtml(sections, PORTFOLIO_BLOCK_STYLES),
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </form>
  );
}
