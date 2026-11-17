'use client';

import { Card, CardContent } from '@/components/ui/card';

export function KPICardSkeleton() {
  return (
    <Card className="bg-surface-card border-0 rounded-card shadow-card h-36 relative animate-pulse">
      <CardContent className="p-6 h-full flex flex-col justify-between">
        {/* Metric Label Skeleton - 2 lines */}
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        
        <div className="space-y-2">
          {/* Large Value Text Skeleton */}
          <div className="h-7 bg-gray-200 rounded w-2/3"></div>
          
          {/* Progress Bar Skeleton */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2"></div>
            <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        
        {/* Info Icon Placeholder */}
        <div className="absolute bottom-2 right-2">
          <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KPICardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <KPICardSkeleton key={index} />
      ))}
    </div>
  );
}