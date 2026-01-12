import { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Helper function to render page buttons with intelligent positioning
  const renderPageButtons = (maxButtons: number) => {
    const buttons: ReactElement[] = [];
    const totalToShow = Math.min(maxButtons, totalPages);

    for (let i = 0; i < totalToShow; i++) {
      let pageNum: number;
      if (totalPages <= maxButtons) {
        pageNum = i + 1;
      } else if (currentPage <= Math.ceil(maxButtons / 2)) {
        pageNum = i + 1;
      } else if (currentPage >= totalPages - Math.floor(maxButtons / 2)) {
        pageNum = totalPages - maxButtons + i + 1;
      } else {
        pageNum = currentPage - Math.floor(maxButtons / 2) + i;
      }

      buttons.push(
        <Button
          key={pageNum}
          variant={currentPage === pageNum ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(pageNum)}
          className="w-11 h-11 p-0 sm:w-10 sm:h-10 md:w-9 md:h-9 text-sm touch-target sm:min-w-0 sm:min-h-0"
          aria-label={`Go to page ${pageNum}`}
          aria-current={currentPage === pageNum ? "page" : undefined}
        >
          {pageNum}
        </Button>
      );
    }
    return buttons;
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination navigation"
      className="flex flex-col gap-4 w-full"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Page {currentPage} of {totalPages}, showing items {startItem} to {endItem} of {totalItems}
      </div>

      {/* Mobile View (< 640px) - Simplified */}
      <div className="flex sm:hidden flex-col gap-4 w-full">
        {/* Page indicator */}
        <div className="text-center text-sm text-muted-foreground font-medium">
          Page {currentPage} of {totalPages}
        </div>

        {/* Navigation buttons - Full width, large touch targets */}
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex-1 h-12 gap-2 touch-target"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex-1 h-12 gap-2 touch-target"
            aria-label="Go to next page"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Page size selector - Full width */}
        <div className="flex items-center justify-center gap-2 w-full">
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(parseInt(val))}
          >
            <SelectTrigger className="w-full max-w-[200px] h-11 touch-target">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tablet View (640px - 1024px) - Condensed */}
      <div className="hidden sm:flex md:hidden flex-col gap-3 w-full">
        {/* Top row: Page size selector + Page info */}
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => onPageSizeChange(parseInt(val))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              per page
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            {startItem}-{endItem} of {totalItems}
          </div>
        </div>

        {/* Bottom row: Navigation - Show 3 page buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-10"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            {renderPageButtons(3)}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-10"
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop View (>= 1024px) - Full Features */}
      <div className="hidden md:flex items-center justify-between gap-6 w-full">
        {/* Left: Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Items per page:
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(parseInt(val))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Center: Item count */}
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} items
        </div>

        {/* Right: Navigation controls - Show 5 page buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            {renderPageButtons(5)}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9"
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
