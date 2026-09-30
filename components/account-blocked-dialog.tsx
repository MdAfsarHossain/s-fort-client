"use client";

import { ShieldXIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearAccountBlocked } from "@/redux/features/accessSlice";

// Rendered globally in the dashboard layout. Any API call rejected with a 403
// (blocked account or DISPOSE role — see redux/api/baseApi.ts) surfaces this
// dialog. It has no cancel/close affordance on purpose: the only way out is
// to log out.
export function AccountBlockedDialog() {
  const message = useAppSelector((state) => state.access.blockedMessage);
  const dispatch = useAppDispatch();
  const { logout } = useAuth();

  function handleLogout() {
    dispatch(clearAccountBlocked());
    logout();
  }

  return (
    <AlertDialog open={!!message}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <ShieldXIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Access removed</AlertDialogTitle>
          <AlertDialogDescription>
            {message ?? "Your access has been removed."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
