"use client";

import { useEffect, useState } from "react";
import { MoreHorizontalIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
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
  useDeletePortfolioMutation,
  useGetPortfoliosQuery,
  type Portfolio,
  type PortfolioStatus,
  type PortfolioType,
  type PortfolioVisibility,
} from "@/redux/api/portfolioApi";

const PAGE_SIZE = 10;
const STATUS_FILTERS: Array<{ value: PortfolioStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];
const VISIBILITY_FILTERS: Array<{ value: PortfolioVisibility; label: string }> = [
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE", label: "Private" },
];
const TYPE_FILTERS: Array<{ value: PortfolioType; label: string }> = [
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "CASE_STUDY", label: "Case study" },
];

const STATUS_BADGE_CLASSES: Record<PortfolioStatus, string> = {
  DRAFT:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  PUBLISHED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
};

const VISIBILITY_BADGE_CLASSES: Record<PortfolioVisibility, string> = {
  PUBLIC: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400",
  PRIVATE:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
};

const TYPE_LABELS: Record<PortfolioType, string> = {
  PORTFOLIO: "Portfolio",
  CASE_STUDY: "Case study",
};

export default function PortfolioPage() {
  useDocumentTitle("Portfolio");
  const { user } = useAuth();
  const canManage = canManageContent(user?.role);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PortfolioStatus | "ALL">("ALL");
  const [visibility, setVisibility] = useState<PortfolioVisibility | "ALL">(
    "ALL"
  );
  const [type, setType] = useState<PortfolioType | "ALL">("ALL");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  function handleStatusChange(value: PortfolioStatus | "ALL") {
    setStatus(value);
    setPage(1);
  }

  function handleVisibilityChange(value: PortfolioVisibility | "ALL") {
    setVisibility(value);
    setPage(1);
  }

  function handleTypeChange(value: PortfolioType | "ALL") {
    setType(value);
    setPage(1);
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setVisibility("ALL");
    setType("ALL");
    setPage(1);
  }

  const hasActiveFilters =
    searchInput !== "" || status !== "ALL" || visibility !== "ALL" || type !== "ALL";

  const { data, isLoading } = useGetPortfoliosQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
    visibility: visibility === "ALL" ? undefined : visibility,
    type: type === "ALL" ? undefined : type,
  });
  const portfolios = data?.items;
  const [deletePortfolio, { isLoading: isDeleting }] =
    useDeletePortfolioMutation();

  const [deletingPortfolio, setDeletingPortfolio] = useState<Portfolio | null>(
    null
  );

  async function confirmDelete() {
    if (!deletingPortfolio) return;

    try {
      await deletePortfolio(deletingPortfolio.id).unwrap();
      toast.success("Portfolio item deleted");
    } catch {
      toast.error("Failed to delete portfolio item");
    } finally {
      setDeletingPortfolio(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your portfolio items and case studies.
          </p>
        </div>
        {canManage ? (
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/portfolio/create" />}
          >
            <PlusIcon />
            New portfolio item
          </Button>
        ) : (
          <Button
            disabled
            title="Editors and disposed accounts can't create portfolio items"
          >
            <PlusIcon />
            New portfolio item
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search portfolio items..."
            className="pl-8"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          value={type}
          onValueChange={(value) => handleTypeChange(value as PortfolioType | "ALL")}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {TYPE_FILTERS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) =>
            handleStatusChange(value as PortfolioStatus | "ALL")
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
            handleVisibilityChange(value as PortfolioVisibility | "ALL")
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
              <TableHead className="hidden sm:table-cell">Client</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">
                Visibility
              </TableHead>
              <TableHead className="hidden lg:table-cell">Author</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && portfolios?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No portfolio items yet. Create your first one.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              portfolios?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-40 font-medium sm:max-w-64">
                    <span className="block truncate">{item.title}</span>
                  </TableCell>
                  <TableCell className="hidden max-w-32 truncate text-muted-foreground sm:table-cell">
                    {item.client || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {TYPE_LABELS[item.type]}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE_CLASSES[item.status]}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge className={VISIBILITY_BADGE_CLASSES[item.visibility]}>
                      {item.visibility}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {item.author?.name ?? "—"}
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
                            <Link href={`/dashboard/portfolio/${item.id}/edit`} />
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={!canManage}
                          title={
                            canManage
                              ? undefined
                              : "Editors and disposed accounts can't delete portfolio items"
                          }
                          onClick={() => setDeletingPortfolio(item)}
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
        open={!!deletingPortfolio}
        onOpenChange={(open) => !open && setDeletingPortfolio(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this portfolio item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingPortfolio?.title}
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
