"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { PortfolioForm } from "@/components/portfolio/portfolio-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function CreatePortfolioPage() {
  useDocumentTitle("New portfolio item");
  const router = useRouter();

  function goBack() {
    router.push("/dashboard/portfolio");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={goBack}>
          <ArrowLeftIcon />
          <span className="sr-only">Back to portfolio</span>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-semibold">
            New portfolio item
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details to publish a new portfolio item.
          </p>
        </div>
      </div>

      <Card className="w-full flex-1">
        <CardContent>
          <PortfolioForm onSaved={goBack} onCancel={goBack} />
        </CardContent>
      </Card>
    </div>
  );
}
