"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { setAccessToken, setRefreshToken } from "@/lib/cookies";
import { useDocumentTitle } from "@/lib/use-document-title";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error || !accessToken || !refreshToken) {
      toast.error("Google sign-in failed. Please try again.");
      router.replace(ROUTES.LOGIN);
      return;
    }

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    // Hard navigation so AuthProvider remounts and picks up the freshly set
    // cookies via its own effect, instead of client-side routing into a tree
    // that already decided (on first load, with no token) that user is null.
    window.location.href = ROUTES.DASHBOARD_OVERVIEW;
  }, [searchParams, router]);

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </CardContent>
    </Card>
  );
}

export default function GoogleCallbackPage() {
  useDocumentTitle("Signing in");

  return (
    <Suspense>
      <GoogleCallbackContent />
    </Suspense>
  );
}
