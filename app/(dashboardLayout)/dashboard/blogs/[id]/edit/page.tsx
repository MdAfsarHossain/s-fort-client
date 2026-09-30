"use client";

import { use, useState } from "react";
import { ArrowLeftIcon, Share2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

import { BlogForm } from "@/components/blogs/blog-form";
import { ShareToSocialDialog } from "@/components/blogs/share-to-social-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useGetBlogQuery } from "@/redux/api/blogApi";

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  useDocumentTitle("Edit blog");
  const { id } = use(params);
  const router = useRouter();
  const { data: blog, isFetching, isError } = useGetBlogQuery(id);
  const [isSharing, setIsSharing] = useState(false);

  function goBack() {
    router.push("/dashboard/blogs");
  }

  return (
    // <div className="flex w-full flex-1 max-w-7xl mx-auto flex-col gap-4">
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={goBack}>
          <ArrowLeftIcon />
          <span className="sr-only">Back to blogs</span>
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-semibold">Edit blog</h1>
          <p className="text-sm text-muted-foreground">
            Update the details for this post.
          </p>
        </div>
        {blog && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setIsSharing(true)}
          >
            <Share2Icon />
            Share to social
          </Button>
        )}
      </div>

      <Card className="w-full flex-1">
        <CardContent>
          {isFetching ? (
            <div className="flex flex-col gap-3 py-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : isError || !blog ? (
            <p className="py-8 text-center text-muted-foreground">
              This blog could not be found.
            </p>
          ) : (
            <BlogForm blog={blog} onSaved={goBack} onCancel={goBack} />
          )}
        </CardContent>
      </Card>

      <ShareToSocialDialog
        key={blog?.id ?? "none"}
        blog={blog ?? null}
        open={isSharing}
        onOpenChange={setIsSharing}
      />
    </div>
  );
}
