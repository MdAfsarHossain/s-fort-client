"use client";

import { useEffect, useState } from "react";
import {
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  Share2Icon,
  StarIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
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
import { ShareToSocialDialog } from "@/components/blogs/share-to-social-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { canManageContent } from "@/constants/members";
import { useDocumentTitle } from "@/lib/use-document-title";
import {
  useDeleteBlogMutation,
  useGetBlogsQuery,
  type Blog,
  type BlogStatus,
  type BlogVisibility,
} from "@/redux/api/blogApi";

const PAGE_SIZE = 10;
const STATUS_FILTERS: Array<{ value: BlogStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];
const VISIBILITY_FILTERS: Array<{ value: BlogVisibility; label: string }> = [
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE", label: "Private" },
];

const STATUS_BADGE_CLASSES: Record<BlogStatus, string> = {
  DRAFT:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  PUBLISHED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
};

const VISIBILITY_BADGE_CLASSES: Record<BlogVisibility, string> = {
  PUBLIC: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400",
  PRIVATE:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
};

export default function BlogsPage() {
  useDocumentTitle("Blogs");
  const { user } = useAuth();
  const canManage = canManageContent(user?.role);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BlogStatus | "ALL">("ALL");
  const [visibility, setVisibility] = useState<BlogVisibility | "ALL">("ALL");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  function handleStatusChange(value: BlogStatus | "ALL") {
    setStatus(value);
    setPage(1);
  }

  function handleVisibilityChange(value: BlogVisibility | "ALL") {
    setVisibility(value);
    setPage(1);
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setVisibility("ALL");
    setPage(1);
  }

  const hasActiveFilters =
    searchInput !== "" || status !== "ALL" || visibility !== "ALL";

  const { data, isLoading } = useGetBlogsQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
    visibility: visibility === "ALL" ? undefined : visibility,
  }); 
  const blogs = data?.items;
  const [deleteBlog, { isLoading: isDeleting }] = useDeleteBlogMutation();

  const [deletingBlog, setDeletingBlog] = useState<Blog | null>(null);
  const [sharingBlog, setSharingBlog] = useState<Blog | null>(null);

  async function confirmDelete() {
    if (!deletingBlog) return;

    try {
      await deleteBlog(deletingBlog.id).unwrap();
      toast.success("Blog deleted");
    } catch {
      toast.error("Failed to delete blog");
    } finally {
      setDeletingBlog(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Blogs</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your blog posts.
          </p>
        </div>
        {canManage ? (
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/blogs/create" />}
          >
            <PlusIcon />
            New blog
          </Button>
        ) : (
          <Button disabled title="Editors and disposed accounts can't create blogs">
            <PlusIcon />
            New blog
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search blogs..."
            className="pl-8"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) =>
            handleStatusChange(value as BlogStatus | "ALL")
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUS_FILTERS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={visibility}
          onValueChange={(value) =>
            handleVisibilityChange(value as BlogVisibility | "ALL")
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All visibility</SelectItem>
            {VISIBILITY_FILTERS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <XIcon />
            Clear filters
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Featured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">
                Visibility
              </TableHead>
              {/* <TableHead>Views</TableHead> */}
              <TableHead className="hidden lg:table-cell">Author</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && blogs?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-muted-foreground"
                >
                  No blogs yet. Create your first one.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              blogs?.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="max-w-40 font-medium sm:max-w-64">
                    <span className="block truncate">{blog.title}</span>
                  </TableCell>
                  <TableCell className="hidden max-w-32 text-muted-foreground sm:table-cell sm:max-w-48">
                    <span className="block truncate">
                      {blog.category.join(", ")}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {blog.is_featured ? (
                      <StarIcon className="size-4 fill-amber-400 text-amber-400" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE_CLASSES[blog.status]}>
                      {blog.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge className={VISIBILITY_BADGE_CLASSES[blog.visibility]}>
                      {blog.visibility}
                    </Badge>
                  </TableCell>
                  {/* <TableCell className="text-muted-foreground">
                    {blog.view_count}
                  </TableCell> */}
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {blog.author?.name ?? "—"}
                  </TableCell>
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
                          render={
                            <Link href={`/dashboard/blogs/${blog.id}/edit`} />
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSharingBlog(blog)}>
                          <Share2Icon />
                          Share to social
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={!canManage}
                          title={
                            canManage
                              ? undefined
                              : "Editors and disposed accounts can't delete blogs"
                          }
                          onClick={() => setDeletingBlog(blog)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls meta={data?.meta} onPageChange={setPage} />

      <AlertDialog
        open={!!deletingBlog}
        onOpenChange={(open) => !open && setDeletingBlog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this blog?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingBlog?.title}&quot;.
              This action cannot be undone.
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

      <ShareToSocialDialog
        key={sharingBlog?.id ?? "none"}
        blog={sharingBlog}
        open={!!sharingBlog}
        onOpenChange={(open) => !open && setSharingBlog(null)}
      />
    </div>
  );
}
