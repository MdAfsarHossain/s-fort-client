"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { BlogForm } from "@/components/blogs/blog-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function CreateBlogPage() {
  useDocumentTitle("New blog");
  const router = useRouter();

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
        <div>
          <h1 className="font-heading text-xl font-semibold">New blog</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details to publish a new post.
          </p>
        </div>
      </div>

      <Card className="w-full flex-1">
        <CardContent>
          <BlogForm onSaved={goBack} onCancel={goBack} />
        </CardContent>
      </Card>
    </div>
  );
}
