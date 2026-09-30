import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/redux/api/types";

interface PaginationControlsProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  meta = {
    page: 1,
    limit: 10,
    total: 0,
    totalPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  onPageChange,
}: PaginationControlsProps) {
  // if (!meta || meta.totalPage <= 1) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {meta.page} of {meta.totalPage} &middot; {meta.total} total
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeftIcon />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
