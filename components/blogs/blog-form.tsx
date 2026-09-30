"use client";

import { useState, type SubmitEvent } from "react";
import {
  ChevronDownIcon,
  LayoutGridIcon,
  Loader2Icon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { BlockContentEditor } from "@/components/blogs/block-content-editor";
import { createSection, type Section } from "@/components/blogs/blocks/types";
import { parseBlocksFromHtml } from "@/components/blogs/blocks/parse";
import { serializeBlocksToHtml } from "@/components/blogs/blocks/serialize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/blogs/rich-text-editor";
import { cn } from "@/lib/utils";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import {
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useUploadBlogImageMutation,
  type Blog,
  type BlogFormFields,
  type BlogStatus,
  type BlogVisibility,
} from "@/redux/api/blogApi";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY_FORM = {
  title: "",
  slug: "",
  category: [] as string[],
  excerpt: "",
  isFeatured: false,
  content: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  visibility: "PUBLIC" as BlogVisibility,
  status: "DRAFT" as BlogStatus,
};

// Only the update endpoint expects a true partial body — diff against the
// originally loaded blog so untouched fields (e.g. content, seo_keywords)
// aren't resent and don't trip the backend's stricter update validation.
function diffBlogFields(
  original: Blog,
  next: BlogFormFields
): Partial<BlogFormFields> {
  const diff: Partial<BlogFormFields> = {};

  if (next.title !== original.title) diff.title = next.title;
  if (next.slug !== original.slug) diff.slug = next.slug;
  if (JSON.stringify(next.category) !== JSON.stringify(original.category)) {
    diff.category = next.category;
  }
  if (next.excerpt !== original.excerpt) diff.excerpt = next.excerpt;
  if (next.is_featured !== original.is_featured)
    diff.is_featured = next.is_featured;
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

function toFormState(blog?: Blog | null) {
  if (!blog) return EMPTY_FORM;

  // A blocks-authored blog's `content` is the Drag/Drop drawer's data —
  // showing that same (degraded, wrapper-and-all) HTML in the rich-text
  // editor too would duplicate it across both editors. Keep them separate:
  // rich-text starts blank here, and blocks are recovered separately below.
  const isBlocksAuthored = !!parseBlocksFromHtml(blog.content);

  return {
    title: blog.title,
    slug: blog.slug,
    category: blog.category,
    excerpt: blog.excerpt,
    isFeatured: blog.is_featured,
    content: isBlocksAuthored ? "" : blog.content,
    seoTitle: blog.seo_title,
    seoDescription: blog.seo_description,
    seoKeywords: blog.seo_keywords.join(", "),
    visibility: blog.visibility,
    status: blog.status,
  };
}

export function BlogForm({
  blog,
  onSaved,
  onCancel,
}: {
  blog?: Blog | null;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const isEditing = !!blog;
  const [form, setForm] = useState(() => toFormState(blog));
  // Once a blog already has an established slug (editing) or the user has
  // typed into the slug field directly, stop auto-deriving it from the
  // title — silently changing a published post's slug breaks its URL.
  const [slugTouched, setSlugTouched] = useState(isEditing);
  // A blog authored via the Drag/Drop drawer has its section/block list
  // encoded inside its own `content` HTML (see serializeBlocksToHtml) —
  // recover it here so editing repopulates the canvas instead of starting
  // empty. Whenever any section has blocks, they take precedence over the
  // rich-text content at submit time (see handleSubmit) — no separate
  // "active mode" needed. Always keep at least one section so there's
  // somewhere to drop a block immediately.
  const [sections, setSections] = useState<Section[]>(
    () => (blog && parseBlocksFromHtml(blog.content)) || [createSection()]
  );
  const totalBlockCount = sections.reduce(
    (sum, section) => sum + section.blocks.length,
    0
  );
  const [blockDrawerOpen, setBlockDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"edit" | "preview">("edit");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const originalImageUrls = blog?.featured_image ?? [];
  const [keptImageUrls, setKeptImageUrls] = useState<string[]>(
    () => originalImageUrls
  );
  const [createBlog, { isLoading: isCreating }] = useCreateBlogMutation();
  const [updateBlog, { isLoading: isUpdating }] = useUpdateBlogMutation();
  const isSubmitting = isCreating || isUpdating;
  const [uploadBlogImage] = useUploadBlogImageMutation();

  const { data: categoriesData } = useGetCategoriesQuery({
    page: 1,
    limit: 100,
  });
  const categoryOptions = categoriesData?.items ?? [];

  function toggleCategory(name: string) {
    setForm((prev) => ({
      ...prev,
      category: prev.category.includes(name)
        ? prev.category.filter((existing) => existing !== name)
        : [...prev.category, name],
    }));
  }

  function removeExistingImage(url: string) {
    setKeptImageUrls((prev) => prev.filter((kept) => kept !== url));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.category.length === 0) {
      toast.error("Select at least one category");
      return;
    }

    // Both editors feed this single field — sections take precedence once any
    // have blocks, otherwise the rich-text content is used.
    const content =
      totalBlockCount > 0 ? serializeBlocksToHtml(sections) : form.content;

    const fullFields: BlogFormFields = {
      title: form.title,
      slug: form.slug,
      category: form.category,
      excerpt: form.excerpt,
      is_featured: form.isFeatured,
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
      if (isEditing && blog) {
        const fields: Partial<BlogFormFields> & { urlsToSave?: string[] } =
          diffBlogFields(blog, fullFields);
        if (imagesChanged) {
          fields.urlsToSave = keptImageUrls;
        }
        if (Object.keys(fields).length === 0 && !hasNewImages) {
          onSaved();
          return;
        }
        await updateBlog({
          id: blog.id,
          fields,
          images: hasNewImages ? images : undefined,
        }).unwrap();
        toast.success("Blog updated");
      } else {
        await createBlog({
          fields: fullFields,
          images: hasNewImages ? images : undefined,
        }).unwrap();
        toast.success("Blog created");
      }
      onSaved();
    } catch {
      toast.error(isEditing ? "Failed to update blog" : "Failed to create blog");
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Basic info
        </h3>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="blog-title">Title</Label>
          <Input
            id="blog-title"
            required
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug: slugTouched ? prev.slug : slugify(title),
              }));
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="blog-slug">Slug</Label>
          <div className="flex gap-2">
            <Input
              id="blog-slug"
              required
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: event.target.value }));
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="shrink-0"
              onClick={() => {
                setSlugTouched(false);
                setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
              }}
            >
              <RefreshCwIcon />
              <span className="sr-only">Generate slug from title</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="blog-category">Categories</Label>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  id="blog-category"
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <span
                    className={cn(
                      "truncate text-left",
                      form.category.length === 0 && "text-muted-foreground"
                    )}
                  >
                    {form.category.length > 0
                      ? form.category.join(", ")
                      : "Select categories"}
                  </span>
                  <ChevronDownIcon className="shrink-0 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="start">
              {categoryOptions.length === 0 && (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  No categories yet — create one from the Categories page.
                </p>
              )}
              {categoryOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.id}
                  checked={form.category.includes(option.name)}
                  onCheckedChange={() => toggleCategory(option.name)}
                >
                  {option.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {form.category.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.category.map((name) => (
                <Badge key={name} variant="secondary" className="gap-1 pr-1">
                  {name}
                  <button
                    type="button"
                    onClick={() => toggleCategory(name)}
                    aria-label={`Remove ${name}`}
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="blog-excerpt">Excerpt</Label>
          <Textarea
            id="blog-excerpt"
            // required
            placeholder="Short summary shown in listings"
            value={form.excerpt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, excerpt: event.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="blog-featured-image">Featured images</Label>
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
            id="blog-featured-image"
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
          placeholder="Write the post body..."
        />
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-muted-foreground">SEO</h3>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="blog-seo-title">SEO title</Label>
          <Input
            id="blog-seo-title"
            required
            value={form.seoTitle}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, seoTitle: event.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="blog-seo-description">SEO description</Label>
          <Textarea
            id="blog-seo-description"
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
          <Label htmlFor="blog-seo-keywords">SEO keywords</Label>
          <Input
            id="blog-seo-keywords"
            required
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
            <Label htmlFor="blog-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, status: value as BlogStatus }))
              }
            >
              <SelectTrigger id="blog-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="blog-visibility">Visibility</Label>
            <Select
              value={form.visibility}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  visibility: value as BlogVisibility,
                }))
              }
            >
              <SelectTrigger id="blog-visibility" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Switch
            id="blog-featured"
            checked={form.isFeatured}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, isFeatured: checked }))
            }
          />
          <Label htmlFor="blog-featured">Featured post</Label>
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
          {isEditing ? "Save changes" : "Create blog"}
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
                uploadImage={(file) => uploadBlogImage(file).unwrap()}
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
                  className="rounded-md border p-4 text-sm [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2:first-child]:mt-0 [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_h4]:mb-1.5 [&_h4]:mt-2 [&_h4]:text-sm [&_h4]:font-semibold [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-md [&_p]:mb-3 [&_p:last-child]:mb-0"
                  // Safe: every block's text/attrs is HTML-escaped by
                  // serializeBlocksToHtml before being interpolated.
                  dangerouslySetInnerHTML={{
                    __html: serializeBlocksToHtml(sections),
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
