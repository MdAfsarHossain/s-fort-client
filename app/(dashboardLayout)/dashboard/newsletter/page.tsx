"use client";

import { useEffect, useState } from "react";
import { SearchIcon, TriangleAlertIcon, Trash2Icon, XIcon } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/lib/use-document-title";
import { canManageContent } from "@/constants/members";
import {
  useDeleteSubscriberMutation,
  useGetSubscribersQuery,
  useUpdateSubscriberMutation,
  type Subscriber,
} from "@/redux/api/newsletterApi";

const PAGE_SIZE = 10;

type TriState = "ALL" | "true" | "false";

const ACTIVE_FILTERS: Array<{ value: TriState; label: string }> = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const SUSPICIOUS_FILTERS: Array<{ value: TriState; label: string }> = [
  { value: "true", label: "Flagged" },
  { value: "false", label: "Not flagged" },
];

function triStateToBoolean(value: TriState): boolean | undefined {
  return value === "ALL" ? undefined : value === "true";
}

export default function NewsletterPage() {
  useDocumentTitle("Newsletter");
  const { user } = useAuth();
  const canManage = canManageContent(user?.role);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<TriState>("ALL");
  const [isSuspicious, setIsSuspicious] = useState<TriState>("ALL");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  function handleActiveChange(value: TriState) {
    setIsActive(value);
    setPage(1);
  }

  function handleSuspiciousChange(value: TriState) {
    setIsSuspicious(value);
    setPage(1);
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setIsActive("ALL");
    setIsSuspicious("ALL");
    setPage(1);
  }

  const hasActiveFilters =
    searchInput !== "" || isActive !== "ALL" || isSuspicious !== "ALL";

  const { data, isLoading } = useGetSubscribersQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    is_active: triStateToBoolean(isActive),
    is_suspicious: triStateToBoolean(isSuspicious),
  });
  const subscribers = data?.items;
  const [updateSubscriber] = useUpdateSubscriberMutation();
  const [deleteSubscriber, { isLoading: isDeleting }] =
    useDeleteSubscriberMutation();

  const [deletingSubscriber, setDeletingSubscriber] =
    useState<Subscriber | null>(null);

  async function toggleActive(subscriber: Subscriber, is_active: boolean) {
    try {
      await updateSubscriber({ id: subscriber.id, body: { is_active } }).unwrap();
      toast.success(`${subscriber.email} ${is_active ? "active" : "inactive"} `)
    } catch {
      toast.error("Failed to update subscriber");
    }
  }

  async function toggleSuspicious(
    subscriber: Subscriber,
    is_suspicious: boolean
  ) {
    try {
      await updateSubscriber({
        id: subscriber.id,
        body: { is_suspicious },
      }).unwrap();
      toast.success(`${subscriber.email} ${is_suspicious ? "flagged" : "unflagged"} `)
    } catch {
      toast.error("Failed to update subscriber");
    }
  }

  async function confirmDelete() {
    if (!deletingSubscriber) return;

    try {
      await deleteSubscriber(deletingSubscriber.id).unwrap();
      toast.success("Subscriber removed");
    } catch {
      toast.error("Failed to remove subscriber");
    } finally {
      setDeletingSubscriber(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">Newsletter</h1>
        <p className="text-sm text-muted-foreground">
          Manage newsletter subscribers.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            className="pl-8"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          value={isActive}
          onValueChange={(value) => handleActiveChange(value as TriState)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Active" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ACTIVE_FILTERS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={isSuspicious}
          onValueChange={(value) => handleSuspiciousChange(value as TriState)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Suspicious" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All subscribers</SelectItem>
            {SUSPICIOUS_FILTERS.map(({ value, label }) => (
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
              <TableHead>Email</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="hidden sm:table-cell">
                Suspicious
              </TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && subscribers?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No subscribers yet.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              subscribers?.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="max-w-40 truncate font-medium sm:max-w-64">
                    {subscriber.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={subscriber.is_active}
                        disabled={!canManage}
                        title={
                          canManage
                            ? undefined
                            : "Editors and disposed accounts can't change subscriber status"
                        }
                        onCheckedChange={(checked) =>
                          toggleActive(subscriber, checked)
                        }
                      />
                      <span className="hidden text-sm text-muted-foreground sm:inline">
                        {subscriber.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={subscriber.is_suspicious}
                        disabled={!canManage}
                        title={
                          canManage
                            ? undefined
                            : "Editors and disposed accounts can't change subscriber status"
                        }
                        onCheckedChange={(checked) =>
                          toggleSuspicious(subscriber, checked)
                        }
                      />
                      {subscriber.is_suspicious && (
                        <Badge variant="destructive">
                          <TriangleAlertIcon />
                          Flagged
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {new Date(subscriber.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={!canManage}
                      title={
                        canManage
                          ? undefined
                          : "Editors and disposed accounts can't remove subscribers"
                      }
                      onClick={() => setDeletingSubscriber(subscriber)}
                    >
                      <Trash2Icon />
                      <span className="sr-only">Remove subscriber</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls meta={data?.meta} onPageChange={setPage} />

      <AlertDialog
        open={!!deletingSubscriber}
        onOpenChange={(open) => !open && setDeletingSubscriber(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this subscriber?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deletingSubscriber?.email}
              &quot; from your newsletter list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
