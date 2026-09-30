"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3Icon,
  Loader2Icon,
  ShieldAlertIcon,
  UnplugIcon,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { canManageMembers } from "@/constants/members";
import { ROUTES } from "@/constants/routes";
import { useDocumentTitle } from "@/lib/use-document-title";
import {
  useDisconnectGscMutation,
  useGetGscStatusQuery,
  useLazyGetGscConnectUrlQuery,
} from "@/redux/api/connectionsApi";
import {
  useLazyGetGscSitesQuery,
  useSetGscActiveSiteMutation,
} from "@/redux/api/searchConsoleApi";
import {
  useConnectInstagramMutation,
  useDisconnectSocialMutation,
  useGetSocialConnectionsQuery,
  useLazyGetSocialConnectUrlQuery,
  useLazyGetSocialTargetsQuery,
  useSelectSocialTargetMutation,
} from "@/redux/api/socialApi";
import {
  FacebookLogo,
  GoogleLogo,
  InstagramLogo,
  LinkedInLogo,
} from "@/components/social/platform-logos";

function GoogleSearchConsoleCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: connection, isLoading } = useGetGscStatusQuery();
  const [getConnectUrl, { isFetching: isPreparingConnect }] =
    useLazyGetGscConnectUrlQuery();
  const [disconnectGsc, { isLoading: isDisconnecting }] =
    useDisconnectGscMutation();
  const [getSites, { data: sites, isFetching: isLoadingSites }] =
    useLazyGetGscSitesQuery();
  const [setActiveSite, { isLoading: isSavingSite }] =
    useSetGscActiveSiteMutation();
  const [selectedSite, setSelectedSite] = useState<string>("");

  const isConnected = !!connection;
  const needsSiteSelection = isConnected && !connection?.site_url;

  useEffect(() => {
    const gscConnected = searchParams.get("gsc_connected");
    const error = searchParams.get("error");

    if (gscConnected) {
      toast.success("Google Search Console connected");
      router.replace("/dashboard/connections");
    } else if (error === "google_auth_failed") {
      toast.error("Failed to connect Google Search Console");
      router.replace("/dashboard/connections");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (needsSiteSelection) {
      getSites().catch(() => {
        toast.error("Failed to load Search Console properties");
      });
    }
  }, [needsSiteSelection, getSites]);

  async function handleConnect() {
    try {
      const result = await getConnectUrl().unwrap();
      window.location.href = result.url;
    } catch {
      toast.error("Failed to start Google Search Console connection");
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectGsc().unwrap();
      toast.success("Google Search Console disconnected");
    } catch {
      toast.error("Failed to disconnect Google Search Console");
    }
  }

  async function handleSaveSite() {
    if (!selectedSite) return;
    try {
      await setActiveSite({ siteUrl: selectedSite }).unwrap();
      toast.success("Search Console property saved");
    } catch {
      toast.error("Failed to save Search Console property");
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background">
          <GoogleLogo />
        </span>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Google Search Console</span>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : isConnected ? (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {needsSiteSelection
              ? `Connected as ${connection?.email}. Select which property to track below.`
              : isConnected
                ? `Connected as ${connection?.email}, tracking ${connection?.site_url}.`
                : "Connect your Google Search Console account to track search performance and indexing status directly from Scrumfort."}
          </p>

          {needsSiteSelection && (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedSite}
                onValueChange={(value) => setSelectedSite(value ?? "")}
                disabled={isLoadingSites}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue
                    placeholder={
                      isLoadingSites ? "Loading properties..." : "Select a property"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site.siteUrl} value={site.siteUrl}>
                      {site.siteUrl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!selectedSite || isSavingSite}
                onClick={handleSaveSite}
              >
                {isSavingSite && <Loader2Icon className="animate-spin" />}
                Save
              </Button>
            </div>
          )}

          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : isConnected ? (
            <div className="flex flex-wrap items-center gap-2">
              {connection?.site_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  nativeButton={false}
                  render={<Link href={ROUTES.DASHBOARD_SEARCH_PERFORMANCE} />}
                >
                  <BarChart3Icon />
                  View analytics
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit text-destructive hover:text-destructive"
                      disabled={isDisconnecting}
                    >
                      <UnplugIcon />
                      Disconnect
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Disconnect Google Search Console?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Scrumfort will lose access to search performance data
                      from &quot;{connection?.email}&quot; until you reconnect.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isDisconnecting}
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-fit"
              disabled={isPreparingConnect}
              onClick={handleConnect}
            >
              {isPreparingConnect && <Loader2Icon className="animate-spin" />}
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FacebookCard() {
  const { data: connections, isLoading } = useGetSocialConnectionsQuery();
  const [getConnectUrl, { isFetching: isPreparingConnect }] =
    useLazyGetSocialConnectUrlQuery();
  const [disconnect, { isLoading: isDisconnecting }] =
    useDisconnectSocialMutation();
  const [getTargets, { data: targets, isFetching: isLoadingTargets }] =
    useLazyGetSocialTargetsQuery();
  const [selectTarget, { isLoading: isSavingTarget }] =
    useSelectSocialTargetMutation();
  const [selectedTarget, setSelectedTarget] = useState<string>("");

  const connection = connections?.FACEBOOK ?? null;
  const isConnected = !!connection;
  const needsTargetSelection = isConnected && !connection?.target_id;

  useEffect(() => {
    if (needsTargetSelection) {
      getTargets({ platform: "FACEBOOK" }).catch(() => {
        toast.error("Failed to load Facebook Pages");
      });
    }
  }, [needsTargetSelection, getTargets]);

  async function handleConnect() {
    try {
      const result = await getConnectUrl({ platform: "FACEBOOK" }).unwrap();
      window.location.href = result.url;
    } catch {
      toast.error("Failed to start Facebook connection");
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect({ platform: "FACEBOOK" }).unwrap();
      toast.success("Facebook disconnected");
    } catch {
      toast.error("Failed to disconnect Facebook");
    }
  }

  async function handleSaveTarget() {
    if (!selectedTarget) return;
    try {
      await selectTarget({
        platform: "FACEBOOK",
        targetId: selectedTarget,
      }).unwrap();
      toast.success("Facebook Page saved");
    } catch {
      toast.error("Failed to save Facebook Page");
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background">
          <FacebookLogo />
        </span>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Facebook</span>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : isConnected ? (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {needsTargetSelection
              ? `Connected as ${connection?.external_account_name}. Select which Page to post to below.`
              : isConnected
                ? `Connected as ${connection?.external_account_name}, posting to ${connection?.target_name}.`
                : "Connect a Facebook account to publish blog posts to a Page's feed."}
          </p>

          {needsTargetSelection && (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedTarget}
                onValueChange={(value) => setSelectedTarget(value ?? "")}
                disabled={isLoadingTargets}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue
                    placeholder={
                      isLoadingTargets ? "Loading Pages..." : "Select a Page"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {targets?.map((target) => (
                    <SelectItem key={target.id} value={target.id}>
                      {target.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!selectedTarget || isSavingTarget}
                onClick={handleSaveTarget}
              >
                {isSavingTarget && <Loader2Icon className="animate-spin" />}
                Save
              </Button>
            </div>
          )}

          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : isConnected ? (
            <div className="flex flex-wrap items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit text-destructive hover:text-destructive"
                      disabled={isDisconnecting}
                    >
                      <UnplugIcon />
                      Disconnect
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Facebook?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Scrumfort will no longer be able to publish blog posts to
                      &quot;{connection?.external_account_name}&quot; until you
                      reconnect.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isDisconnecting}
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-fit"
              disabled={isPreparingConnect}
              onClick={handleConnect}
            >
              {isPreparingConnect && <Loader2Icon className="animate-spin" />}
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InstagramCard() {
  const { data: connections, isLoading } = useGetSocialConnectionsQuery();
  const [connectInstagram, { isLoading: isConnecting }] =
    useConnectInstagramMutation();
  const [disconnect, { isLoading: isDisconnecting }] =
    useDisconnectSocialMutation();

  const facebookConnection = connections?.FACEBOOK ?? null;
  const isFacebookReady = !!facebookConnection?.target_id;
  const connection = connections?.INSTAGRAM ?? null;
  const isConnected = !!connection;

  async function handleConnect() {
    try {
      await connectInstagram().unwrap();
      toast.success("Instagram connected");
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Failed to connect Instagram";
      toast.error(message);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect({ platform: "INSTAGRAM" }).unwrap();
      toast.success("Instagram disconnected");
    } catch {
      toast.error("Failed to disconnect Instagram");
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background">
          <InstagramLogo />
        </span>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Instagram</span>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : isConnected ? (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isConnected
              ? `Connected as ${connection?.target_name ?? connection?.external_account_name}.`
              : isFacebookReady
                ? "Connect the Instagram Business account linked to your Facebook Page. Instagram posts require a featured image, and the blog link won't be clickable in the caption."
                : "Connect Facebook and select a Page first — Instagram posting reuses that connection."}
          </p>

          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : isConnected ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit text-destructive hover:text-destructive"
                    disabled={isDisconnecting}
                  >
                    <UnplugIcon />
                    Disconnect
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Instagram?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Scrumfort will no longer be able to publish blog posts to
                    &quot;{connection?.target_name}&quot; until you reconnect.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isDisconnecting}
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              size="sm"
              className="w-fit"
              disabled={!isFacebookReady || isConnecting}
              onClick={handleConnect}
            >
              {isConnecting && <Loader2Icon className="animate-spin" />}
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LinkedInCard() {
  const { data: connections, isLoading } = useGetSocialConnectionsQuery();
  const [getConnectUrl, { isFetching: isPreparingConnect }] =
    useLazyGetSocialConnectUrlQuery();
  const [disconnect, { isLoading: isDisconnecting }] =
    useDisconnectSocialMutation();

  const connection = connections?.LINKEDIN ?? null;
  const isConnected = !!connection;

  async function handleConnect() {
    try {
      const result = await getConnectUrl({ platform: "LINKEDIN" }).unwrap();
      window.location.href = result.url;
    } catch {
      toast.error("Failed to start LinkedIn connection");
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect({ platform: "LINKEDIN" }).unwrap();
      toast.success("LinkedIn disconnected");
    } catch {
      toast.error("Failed to disconnect LinkedIn");
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background">
          <LinkedInLogo />
        </span>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">LinkedIn</span>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : isConnected ? (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isConnected
              ? `Connected as ${connection?.external_account_name} (personal profile).`
              : "Connect your LinkedIn profile to share blog posts as \"Share on LinkedIn\" updates. Company page posting needs LinkedIn's separately-approved Community Management API."}
          </p>

          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : isConnected ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit text-destructive hover:text-destructive"
                    disabled={isDisconnecting}
                  >
                    <UnplugIcon />
                    Disconnect
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect LinkedIn?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Scrumfort will no longer be able to publish blog posts to
                    &quot;{connection?.external_account_name}&quot; until you
                    reconnect.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isDisconnecting}
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              size="sm"
              className="w-fit"
              disabled={isPreparingConnect}
              onClick={handleConnect}
            >
              {isPreparingConnect && <Loader2Icon className="animate-spin" />}
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const socialConnected = searchParams.get("social_connected");
    const error = searchParams.get("error");

    if (socialConnected) {
      const label =
        socialConnected.charAt(0).toUpperCase() + socialConnected.slice(1);
      toast.success(`${label} connected`);
      router.replace("/dashboard/connections");
    } else if (error === "social_auth_failed") {
      toast.error("Failed to connect social account");
      router.replace("/dashboard/connections");
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl font-semibold">Connections</h1>
        <p className="text-sm text-muted-foreground">
          Manage third-party integrations connected to Scrumfort.
        </p>
      </div>

      <GoogleSearchConsoleCard />
      <FacebookCard />
      <InstagramCard />
      <LinkedInCard />
    </div>
  );
}

export default function ConnectionsPage() {
  useDocumentTitle("Connections");
  const { user, isLoading: isAuthLoading } = useAuth();
  const canManage = canManageMembers(user?.role);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full max-w-2xl" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
        <ShieldAlertIcon className="size-10 text-muted-foreground" />
        <h1 className="font-heading text-xl font-semibold">Access denied</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Only Admins and Super Admins can manage connections.
        </p>
      </div>
    );
  }

  return (
    <Suspense>
      <ConnectionsContent />
    </Suspense>
  );
}
