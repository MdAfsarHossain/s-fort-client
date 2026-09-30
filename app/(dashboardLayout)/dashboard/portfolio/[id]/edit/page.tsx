"use client";

import { use } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { PortfolioForm } from "@/components/portfolio/portfolio-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useGetPortfolioQuery } from "@/redux/api/portfolioApi";

export default function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  useDocumentTitle("Edit portfolio item");
  const { id } = use(params);
  const router = useRouter();
  const { data: portfolio, isFetching, isError } = useGetPortfolioQuery(id);

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
            Edit portfolio item
          </h1>
          <p className="text-sm text-muted-foreground">
            Update the details for this portfolio item.
          </p>
        </div>
      </div>

      <Card className="w-full flex-1">
        <CardContent>
          {isFetching ? (
            <div className="flex flex-col gap-3 py-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : isError || !portfolio ? (
            <p className="py-8 text-center text-muted-foreground">
              This portfolio item could not be found.
            </p>
          ) : (
            <PortfolioForm
              portfolio={portfolio}
              onSaved={goBack}
              onCancel={goBack}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
