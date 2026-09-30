"use client";

import { useEffect, useState } from "react";
import { MoreHorizontalIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
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
import { useAuth } from "@/context/AuthContext";
import { useDocumentTitle } from "@/lib/use-document-title";
import { canManageContent } from "@/constants/members";
import {
  useDeleteEmployeeMutation,
  useGetEmployeesQuery,
  type Employee,
} from "@/redux/api/employeeApi";

const PAGE_SIZE = 10;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function EmployeesPage() {
  useDocumentTitle("Employees");
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

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  const hasActiveFilters = searchInput !== "";

  const { data, isLoading } = useGetEmployeesQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
  const employees = data?.items;
  const [deleteEmployee, { isLoading: isDeleting }] =
    useDeleteEmployeeMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(
    null
  );
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null
  );

  function openCreateDialog() {
    setEditingEmployee(null);
    setDialogOpen(true);
  }

  function openEditDialog(employee: Employee) {
    setEditingEmployee(employee);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deletingEmployee) return;

    try {
      await deleteEmployee(deletingEmployee.id).unwrap();
      toast.success("Employee deleted");
    } catch {
      toast.error("Failed to delete employee");
    } finally {
      setDeletingEmployee(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team&apos;s profile cards.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog}>
            <PlusIcon />
            Add employee
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or designation..."
            className="pl-8"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
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
              <TableHead className="hidden sm:table-cell">
                Designation
              </TableHead>
              <TableHead className="hidden md:table-cell">Twitter</TableHead>
              <TableHead className="hidden md:table-cell">LinkedIn</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              {canManage && <TableHead className="w-10" />}
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

            {!isLoading && employees?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No employees found.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="max-w-40 font-medium sm:max-w-64">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm" className="shrink-0">
                        <AvatarImage src={employee.image ?? undefined} />
                        <AvatarFallback>
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="block truncate">
                          {employee.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground sm:hidden">
                          {employee.designation}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-64 truncate text-muted-foreground sm:table-cell">
                    {employee.designation}
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate text-muted-foreground md:table-cell">
                    {employee.twitter || "—"}
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate text-muted-foreground md:table-cell">
                    {employee.linkedin || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {new Date(employee.createdAt).toLocaleDateString()}
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
                            onClick={() => openEditDialog(employee)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeletingEmployee(employee)}
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

      {canManage && (
        <>
          <EmployeeFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            employee={editingEmployee}
          />

          <AlertDialog
            open={!!deletingEmployee}
            onOpenChange={(open) => !open && setDeletingEmployee(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this employee?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{deletingEmployee?.name}
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
        </>
      )}
    </div>
  );
}
