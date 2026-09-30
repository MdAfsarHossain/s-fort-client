"use client";

import { useEffect, useState } from "react";
import {
  FolderKanbanIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canManageContent } from "@/constants/members";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/lib/use-document-title";
import {
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  type Category,
} from "@/redux/api/categoriesApi";

const PAGE_SIZE = 10;

export default function CategoriesPage() {
  useDocumentTitle("Categories");
  const { user } = useAuth();
  const canManage = canManageContent(user?.role);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading } = useGetCategoriesQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
  const categories = data?.items;
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );

  function openCreateDialog() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deletingCategory) return;

    try {
      await deleteCategory(deletingCategory.id).unwrap();
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeletingCategory(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize blog posts into topics.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog}>
            <PlusIcon />
            Add category
          </Button>
        )}
      </div>

      <div className="relative sm:max-w-xs">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          className="pl-8"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              {canManage && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={canManage ? 4 : 3}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && categories?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 4 : 3}
                  className="py-10 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FolderKanbanIcon className="size-8" />
                    No categories yet.
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.count}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontalIcon />
                              <span className="sr-only">Actions</span>
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(category)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeletingCategory(category)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls meta={data?.meta} onPageChange={setPage} />

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
      />

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingCategory?.name}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
