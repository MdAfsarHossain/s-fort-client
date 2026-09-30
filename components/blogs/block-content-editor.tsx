"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Code2Icon,
  GripVerticalIcon,
  Heading2Icon,
  ImageIcon,
  ImageUpIcon,
  Loader2Icon,
  MousePointerClickIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  TypeIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  BLOCK_TYPE_LABELS,
  createBlock,
  createSection,
  DEFAULT_BUTTON_COLOR,
  type BlockType,
  type ContentBlock,
  type Section,
} from "@/components/blogs/blocks/types";

// Prefixes a section's droppable id so it can be told apart from a block id
// when resolving drop targets — block ids never contain a colon.
const SECTION_DROPPABLE_PREFIX = "section:";

const PALETTE_ITEMS: Array<{ type: BlockType; icon: LucideIcon }> = [
  { type: "paragraph", icon: TypeIcon },
  { type: "heading", icon: Heading2Icon },
  { type: "image", icon: ImageIcon },
  { type: "button", icon: MousePointerClickIcon },
  { type: "customHtml", icon: Code2Icon },
];

function PaletteItem({ type, icon: Icon }: { type: BlockType; icon: LucideIcon }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: "palette", blockType: type },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      className={cn(
        "flex cursor-grab touch-none items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-sm active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <Icon className="size-4 text-muted-foreground" />
      {BLOCK_TYPE_LABELS[type]}
    </button>
  );
}

function SortableBlock({
  block,
  onUpdate,
  onRemove,
  uploadImage,
}: {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onRemove: () => void;
  uploadImage: (file: File) => Promise<string>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id, data: { source: "canvas" } });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || block.type !== "image") return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      onUpdate({ ...block, src: url });
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex gap-2 rounded-lg border bg-card p-3 shadow-sm",
        isDragging && "opacity-50"
      )}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="mt-1 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
        <span className="sr-only">Drag to reorder</span>
      </button>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {BLOCK_TYPE_LABELS[block.type]}
          </span>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
            <Trash2Icon />
            <span className="sr-only">Remove block</span>
          </Button>
        </div>

        {block.type === "paragraph" && (
          <Textarea
            placeholder="Paragraph text..."
            value={block.text}
            onChange={(event) => onUpdate({ ...block, text: event.target.value })}
          />
        )}

        {block.type === "heading" && (
          <div className="flex gap-2">
            <Select
              value={String(block.level)}
              onValueChange={(value) =>
                onUpdate({ ...block, level: Number(value) as 2 | 3 | 4 | 5 | 6 })
              }
            >
              <SelectTrigger className="w-20 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
                <SelectItem value="4">H4</SelectItem>
                <SelectItem value="5">H5</SelectItem>
                <SelectItem value="6">H6</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Heading text..."
              value={block.text}
              onChange={(event) => onUpdate({ ...block, text: event.target.value })}
            />
          </div>
        )}

        {block.type === "image" && (
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {block.src ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- externally hosted upload URL, not a local/optimizable asset */}
                <img
                  src={block.src}
                  alt={block.alt}
                  className="h-32 w-full rounded-md object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
                    <Loader2Icon className="size-5 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <RefreshCwIcon />
                    <span className="sr-only">Replace image</span>
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    disabled={isUploading}
                    onClick={() => onUpdate({ ...block, src: "" })}
                  >
                    <XIcon />
                    <span className="sr-only">Remove image</span>
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <ImageUpIcon />
                )}
                {isUploading ? "Uploading..." : "Upload image"}
              </Button>
            )}
            <Input
              placeholder="Alt text"
              value={block.alt}
              onChange={(event) => onUpdate({ ...block, alt: event.target.value })}
            />
          </div>
        )}

        {block.type === "button" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Button text"
                value={block.text}
                onChange={(event) =>
                  onUpdate({ ...block, text: event.target.value })
                }
              />
              <Input
                placeholder="Link URL"
                value={block.href}
                onChange={(event) =>
                  onUpdate({ ...block, href: event.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={block.color}
                onChange={(event) =>
                  onUpdate({ ...block, color: event.target.value })
                }
                className="size-8 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
              />
              <Input
                placeholder={DEFAULT_BUTTON_COLOR}
                value={block.color}
                onChange={(event) =>
                  onUpdate({ ...block, color: event.target.value })
                }
                className="font-mono text-xs"
              />
            </div>
          </div>
        )}

        {block.type === "customHtml" && (
          <Textarea
            placeholder="Paste or write raw HTML..."
            value={block.html}
            onChange={(event) => onUpdate({ ...block, html: event.target.value })}
            className="min-h-32 font-mono text-xs"
          />
        )}
      </div>
    </div>
  );
}

// useDroppable must be called from a component actually rendered *inside*
// DndContext — calling it in the component that renders DndContext itself
// (i.e. an ancestor, not a descendant) reads the default/no-op context
// instead of the real one, so the droppable silently never registers.
function SectionCanvas({
  section,
  index,
  canRemove,
  onUpdateBlock,
  onRemoveBlock,
  onRemoveSection,
  uploadImage,
}: {
  section: Section;
  index: number;
  canRemove: boolean;
  onUpdateBlock: (blockId: string, next: ContentBlock) => void;
  onRemoveBlock: (blockId: string) => void;
  onRemoveSection: () => void;
  uploadImage: (file: File) => Promise<string>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, data: { source: "section" } });
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `${SECTION_DROPPABLE_PREFIX}${section.id}`,
  });

  return (
    <div
      ref={setSortableNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex flex-col gap-2 rounded-xl border-2 border-dashed p-3",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...listeners}
            {...attributes}
            className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          >
            <GripVerticalIcon className="size-4" />
            <span className="sr-only">Drag to reorder section</span>
          </button>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Section {index + 1}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={!canRemove}
          title={canRemove ? undefined : "At least one section is required"}
          onClick={onRemoveSection}
        >
          <Trash2Icon />
          <span className="sr-only">Remove section</span>
        </Button>
      </div>

      <div
        ref={setDroppableNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-2 rounded-lg border border-dashed p-3 transition-colors",
          isOver && "border-primary bg-primary/5"
        )}
      >
        {section.blocks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Drag a block into this section.
          </p>
        ) : (
          <SortableContext
            items={section.blocks.map((block) => block.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                onUpdate={(next) => onUpdateBlock(block.id, next)}
                onRemove={() => onRemoveBlock(block.id)}
                uploadImage={uploadImage}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

export function BlockContentEditor({
  sections,
  onChange,
  uploadImage,
}: {
  sections: Section[];
  onChange: (sections: Section[]) => void;
  // Injected so this editor stays content-type agnostic — callers (blog
  // form, portfolio form, ...) each upload through their own endpoint.
  uploadImage: (file: File) => Promise<string>;
}) {
  const [activeDragType, setActiveDragType] = useState<BlockType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.source === "palette") {
      setActiveDragType(data.blockType as BlockType);
    }
  }

  // Resolves a dnd-kit droppable/sortable id to the index of the section it
  // belongs to — either the section's own (empty-canvas) droppable id, or a
  // block id currently living inside one of its sections.
  function findSectionIndex(id: string) {
    if (id.startsWith(SECTION_DROPPABLE_PREFIX)) {
      const sectionId = id.slice(SECTION_DROPPABLE_PREFIX.length);
      return sections.findIndex((section) => section.id === sectionId);
    }
    const directIndex = sections.findIndex((section) => section.id === id);
    if (directIndex !== -1) return directIndex;
    return sections.findIndex((section) =>
      section.blocks.some((block) => block.id === id)
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragType(null);

    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    const activeData = active.data.current;

    if (activeData?.source === "palette") {
      const targetSectionIndex = findSectionIndex(overId);
      if (targetSectionIndex === -1) return;

      const newBlock = createBlock(activeData.blockType as BlockType);
      const targetBlocks = sections[targetSectionIndex].blocks;
      const overBlockIndex = targetBlocks.findIndex(
        (block) => block.id === overId
      );
      const insertIndex =
        overBlockIndex === -1 ? targetBlocks.length : overBlockIndex;

      onChange(
        sections.map((section, index) => {
          if (index !== targetSectionIndex) return section;
          const blocks = [...section.blocks];
          blocks.splice(insertIndex, 0, newBlock);
          return { ...section, blocks };
        })
      );
      return;
    }

    if (activeData?.source === "section") {
      const activeId = String(active.id);
      if (activeId === overId) return;

      const fromSectionIndex = sections.findIndex(
        (section) => section.id === activeId
      );
      const toSectionIndex = findSectionIndex(overId);
      if (
        fromSectionIndex === -1 ||
        toSectionIndex === -1 ||
        fromSectionIndex === toSectionIndex
      ) {
        return;
      }

      onChange(arrayMove(sections, fromSectionIndex, toSectionIndex));
      return;
    }

    const activeId = String(active.id);
    if (activeId === overId) return;

    const fromSectionIndex = findSectionIndex(activeId);
    if (fromSectionIndex === -1) return;

    // Reordering within the same section.
    if (
      !overId.startsWith(SECTION_DROPPABLE_PREFIX) &&
      findSectionIndex(overId) === fromSectionIndex
    ) {
      const fromBlockIndex = sections[fromSectionIndex].blocks.findIndex(
        (block) => block.id === activeId
      );
      const toBlockIndex = sections[fromSectionIndex].blocks.findIndex(
        (block) => block.id === overId
      );
      onChange(
        sections.map((section, index) =>
          index === fromSectionIndex
            ? {
                ...section,
                blocks: arrayMove(section.blocks, fromBlockIndex, toBlockIndex),
              }
            : section
        )
      );
      return;
    }

    // Moving to a different section.
    const toSectionIndex = findSectionIndex(overId);
    if (toSectionIndex === -1) return;

    const movingBlock = sections[fromSectionIndex].blocks.find(
      (block) => block.id === activeId
    );
    if (!movingBlock) return;

    const withoutMoved = sections.map((section, index) =>
      index === fromSectionIndex
        ? { ...section, blocks: section.blocks.filter((b) => b.id !== activeId) }
        : section
    );

    const destinationBlocks = withoutMoved[toSectionIndex].blocks;
    const overBlockIndex = destinationBlocks.findIndex(
      (block) => block.id === overId
    );
    const insertIndex =
      overBlockIndex === -1 ? destinationBlocks.length : overBlockIndex;

    onChange(
      withoutMoved.map((section, index) => {
        if (index !== toSectionIndex) return section;
        const blocks = [...section.blocks];
        blocks.splice(insertIndex, 0, movingBlock);
        return { ...section, blocks };
      })
    );
  }

  function updateBlock(sectionId: string, blockId: string, next: ContentBlock) {
    onChange(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              blocks: section.blocks.map((block) =>
                block.id === blockId ? next : block
              ),
            }
          : section
      )
    );
  }

  function removeBlock(sectionId: string, blockId: string) {
    onChange(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, blocks: section.blocks.filter((b) => b.id !== blockId) }
          : section
      )
    );
  }

  function addSection() {
    onChange([...sections, createSection()]);
  }

  function removeSection(sectionId: string) {
    onChange(sections.filter((section) => section.id !== sectionId));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3">
        <div className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-2 border-b bg-background/95 px-1 py-2 backdrop-blur-sm supports-backdrop-filter:bg-background/75">
          {PALETTE_ITEMS.map(({ type, icon }) => (
            <PaletteItem key={type} type={type} icon={icon} />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <SortableContext
            items={sections.map((section) => section.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section, index) => (
              <SectionCanvas
                key={section.id}
                section={section}
                index={index}
                canRemove={sections.length > 1}
                onUpdateBlock={(blockId, next) =>
                  updateBlock(section.id, blockId, next)
                }
                onRemoveBlock={(blockId) => removeBlock(section.id, blockId)}
                onRemoveSection={() => removeSection(section.id)}
                uploadImage={uploadImage}
              />
            ))}
          </SortableContext>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={addSection}
        >
          <PlusIcon />
          Add section
        </Button>
      </div>

      <DragOverlay>
        {activeDragType && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-lg">
            {BLOCK_TYPE_LABELS[activeDragType]}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
