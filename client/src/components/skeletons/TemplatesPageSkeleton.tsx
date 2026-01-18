/**
 * Templates Page Skeleton
 *
 * Provides loading skeleton for the templates page
 * including template cards and preview areas.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonBadge,
  SkeletonButton,
} from "@/components/ui/skeleton";

/**
 * Skeleton for template preview card
 */
export function TemplatePreviewCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Preview area */}
      <div className="aspect-[4/3] bg-muted/30 relative">
        <Skeleton className="absolute inset-0 rounded-none" />
        {/* Badge overlay */}
        <div className="absolute top-3 right-3">
          <SkeletonBadge />
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center gap-2 pt-2">
            <SkeletonButton size="sm" className="flex-1" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for main template showcase
 */
export function MainTemplateShowcaseSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="overflow-hidden">
        {/* Large preview area */}
        <div className="aspect-[3/4] bg-muted/30 relative">
          <Skeleton className="absolute inset-0 rounded-none" />
          {/* Default badge */}
          <div className="absolute top-4 left-4">
            <SkeletonBadge className="w-20" />
          </div>
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
              <SkeletonButton />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <SkeletonButton className="flex-1" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Skeleton for templates grid
 */
export function TemplatesGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <TemplatePreviewCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Full templates page skeleton
 */
export function TemplatesPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Main template showcase */}
      <MainTemplateShowcaseSkeleton />

      {/* Custom templates section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <SkeletonButton />
        </div>
        <TemplatesGridSkeleton count={3} />
      </div>
    </div>
  );
}
