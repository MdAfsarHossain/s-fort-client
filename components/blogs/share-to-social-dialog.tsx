"use client";

import { useMemo, useState } from "react";
import { ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  FacebookLogo,
  InstagramLogo,
  LinkedInLogo,
} from "@/components/social/platform-logos";
import type { Blog } from "@/redux/api/blogApi";
import {
  useGetSocialConnectionsQuery,
  useGetSocialPostsQuery,
  usePublishToSocialMutation,
  type SocialPlatform,
} from "@/redux/api/socialApi";

const PLATFORM_META: Record<
  SocialPlatform,
  { label: string; Logo: () => React.ReactElement }
> = {
  FACEBOOK: { label: "Facebook", Logo: FacebookLogo },
  INSTAGRAM: { label: "Instagram", Logo: InstagramLogo },
  LINKEDIN: { label: "LinkedIn", Logo: LinkedInLogo },
};

const POST_STATUS_BADGE_CLASSES: Record<string, string> = {
  PUBLISHED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
  PENDING:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

// Draft message/selection state is seeded once on mount, not resynced from
// `blog` on every open — pass `key={blog?.id}` at the call site so a
// different blog gets a fresh instance instead of a stale draft.
export function ShareToSocialDialog({
  blog,
  open,
  onOpenChange,
}: {
  blog: Blog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: connections, isLoading: isLoadingConnections } =
    useGetSocialConnectionsQuery();
  const { data: history, isFetching: isLoadingHistory } =
    useGetSocialPostsQuery({ blogId: blog?.id ?? "" }, { skip: !blog });
  const [publish, { isLoading: isPublishing }] = usePublishToSocialMutation();

  const [selected, setSelected] = useState<Record<SocialPlatform, boolean>>({
    FACEBOOK: false,
    INSTAGRAM: false,
    LINKEDIN: false,
  });
  const [message, setMessage] = useState(() =>
    blog ? [blog.title, blog.excerpt].filter(Boolean).join("\n\n") : ""
  );

  const hasFeaturedImage = !!blog?.featured_image?.length;

  const readiness = useMemo(
    () => ({
      FACEBOOK: !!connections?.FACEBOOK?.target_id,
      INSTAGRAM: !!connections?.INSTAGRAM,
      LINKEDIN: !!connections?.LINKEDIN,
    }),
    [connections]
  );

  const selectedCount = Object.values(selected).filter(Boolean).length;

  async function handlePublish() {
    if (!blog || selectedCount === 0) return;

    const platforms = (Object.keys(selected) as SocialPlatform[]).filter(
      (platform) => selected[platform]
    );

    try {
      const results = await publish({
        blogId: blog.id,
        platforms,
        message,
      }).unwrap();

      const succeeded = results.filter((r) => r.status === "PUBLISHED");
      const failed = results.filter((r) => r.status === "FAILED");

      if (succeeded.length) {
        toast.success(
          `Shared to ${succeeded.map((r) => PLATFORM_META[r.platform].label).join(", ")}`
        );
      }
      failed.forEach((r) => {
        toast.error(
          `${PLATFORM_META[r.platform].label}: ${r.error_message ?? "Failed to share"}`
        );
      });
    } catch {
      toast.error("Failed to share this blog");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share to social</DialogTitle>
          <DialogDescription>
            Post &quot;{blog?.title}&quot; to your connected accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a message..."
            className="min-h-24"
          />

          <div className="flex flex-col gap-3">
            {isLoadingConnections ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              (Object.keys(PLATFORM_META) as SocialPlatform[]).map(
                (platform) => {
                  const { label, Logo } = PLATFORM_META[platform];
                  const isReady = readiness[platform];
                  const caveat =
                    platform === "INSTAGRAM" && isReady && !hasFeaturedImage
                      ? "Add a featured image to this blog first — Instagram posts require one."
                      : platform === "INSTAGRAM" && isReady
                        ? "The blog link won't be clickable in the caption."
                        : !isReady
                          ? `Connect ${label} in Connections to enable this.`
                          : null;

                  const disabled =
                    !isReady || (platform === "INSTAGRAM" && !hasFeaturedImage);

                  return (
                    <div
                      key={platform}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                        <Logo />
                      </span>
                      <div className="flex flex-1 flex-col gap-1">
                        <span className="text-sm font-medium">{label}</span>
                        {caveat && (
                          <span className="text-xs text-muted-foreground">
                            {caveat}
                          </span>
                        )}
                      </div>
                      <Switch
                        checked={selected[platform]}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          setSelected((prev) => ({
                            ...prev,
                            [platform]: checked,
                          }))
                        }
                      />
                    </div>
                  );
                }
              )
            )}
          </div>

          {(isLoadingHistory || !!history?.length) && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Share history
              </span>
              {isLoadingHistory ? (
                <Skeleton className="h-6 w-full" />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {history?.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Badge
                        className={POST_STATUS_BADGE_CLASSES[post.status]}
                      >
                        {PLATFORM_META[post.platform].label}
                      </Badge>
                      <span className="text-muted-foreground">
                        {post.status === "PUBLISHED"
                          ? `Shared ${timeAgo(post.createdAt)}`
                          : post.status === "FAILED"
                            ? (post.error_message ?? "Failed")
                            : "Pending"}
                      </span>
                      {post.external_post_url && (
                        <a
                          href={post.external_post_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          View <ExternalLinkIcon className="size-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={selectedCount === 0 || isPublishing || !message.trim()}
            onClick={handlePublish}
          >
            {isPublishing && <Loader2Icon className="animate-spin" />}
            Share{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
