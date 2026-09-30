"use client";

import { useEffect, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
  XIcon,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MemberFormDialog } from "@/components/members/member-form-dialog";
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
import { useDocumentTitle } from "@/lib/use-document-title";
import {
  MEMBER_ROLES,
  MEMBER_ROLE_BADGE_CLASSES,
  MEMBER_ROLE_LABELS,
  MEMBER_STATUSES,
  MEMBER_STATUS_BADGE_CLASSES,
  MEMBER_STATUS_LABELS,
  canManageMembers,
} from "@/constants/members";
import {
  useDeleteMemberMutation,
  useGetMembersQuery,
  type Member,
  type MemberRole,
  type MemberStatus,
} from "@/redux/api/memberApi";

const PAGE_SIZE = 10;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MembersPage() {
  useDocumentTitle("Members");
  const { user, isLoading: isAuthLoading } = useAuth();
  const canManage = canManageMembers(user?.role);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<MemberRole | "ALL">("ALL");
  const [status, setStatus] = useState<MemberStatus | "ALL">("ALL");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  function handleRoleChange(value: MemberRole | "ALL") {
    setRole(value);
    setPage(1);
  }

  function handleStatusChange(value: MemberStatus | "ALL") {
    setStatus(value);
    setPage(1);
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setRole("ALL");
    setStatus("ALL");
    setPage(1);
  }

  const hasActiveFilters =
    searchInput !== "" || role !== "ALL" || status !== "ALL";

  const { data, isLoading } = useGetMembersQuery(
    canManage
      ? {
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          role: role === "ALL" ? undefined : role,
          status: status === "ALL" ? undefined : status,
        }
      : skipToken
  );
  const members = data?.items;
  const [deleteMember, { isLoading: isDeleting }] = useDeleteMemberMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  function openCreateDialog() {
    setEditingMember(null);
    setDialogOpen(true);
  }

  function openEditDialog(member: Member) {
    setEditingMember(member);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deletingMember) return;

    try {
      await deleteMember(deletingMember.id).unwrap();
      toast.success("Member deleted");
    } catch {
      toast.error("Failed to delete member");
    } finally {
      setDeletingMember(null);
    }
  }

  if (isAuthLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
        <ShieldAlertIcon className="size-10 text-muted-foreground" />
        <h1 className="font-heading text-xl font-semibold">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Only Admins and Super Admins can manage members.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage admin, manager, and editor accounts.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <PlusIcon />
          Add member
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-8"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          value={role}
          onValueChange={(value) =>
            handleRoleChange(value as MemberRole | "ALL")
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {MEMBER_ROLES.map((value) => (
              <SelectItem key={value} value={value}>
                {MEMBER_ROLE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) =>
            handleStatusChange(value as MemberStatus | "ALL")
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {MEMBER_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {MEMBER_STATUS_LABELS[value]}
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
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && members?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No members found.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="max-w-40 font-medium sm:max-w-64">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm" className="shrink-0">
                        <AvatarImage src={member.avatar ?? undefined} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="block truncate">{member.name}</span>
                        <span className="block truncate text-xs text-muted-foreground sm:hidden">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-64 truncate text-muted-foreground sm:table-cell">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <Badge className={MEMBER_ROLE_BADGE_CLASSES[member.role]}>
                      {MEMBER_ROLE_LABELS[member.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={MEMBER_STATUS_BADGE_CLASSES[member.status]}
                    >
                      {MEMBER_STATUS_LABELS[member.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {new Date(member.createdAt).toLocaleDateString()}
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
                          onClick={() => openEditDialog(member)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingMember(member)}
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

      <MemberFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editingMember}
      />

      <AlertDialog
        open={!!deletingMember}
        onOpenChange={(open) => !open && setDeletingMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingMember?.name}&quot;.
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
    </div>
  );
}
