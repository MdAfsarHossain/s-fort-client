"use client";

import { useState, type SubmitEvent } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  type Category,
} from "@/redux/api/categoriesApi";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Rename this category."
              : "Categories are used to tag and group blog posts."}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          key={open ? (category?.id ?? "new") : "closed"}
          category={category}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  category,
  onSaved,
  onCancel,
}: {
  category?: Category | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!category;
  const [name, setName] = useState(category?.name ?? "");

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const isSubmitting = isCreating || isUpdating;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (isEditing && category) {
        if (name.trim() === category.name) {
          onSaved();
          return;
        }
        await updateCategory({ id: category.id, name: name.trim() }).unwrap();
        toast.success("Category updated");
      } else {
        await createCategory({ name: name.trim() }).unwrap();
        toast.success("Category created");
      }
      onSaved();
    } catch {
      toast.error(
        isEditing ? "Failed to update category" : "Failed to create category"
      );
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          required
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          {isEditing ? "Save changes" : "Create category"}
        </Button>
      </DialogFooter>
    </form>
  );
}
