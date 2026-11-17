'use client';

import { useEffect } from 'react';
import { shouldShowDebugErrors } from '@/lib/utils/environment';
import { logSilentError } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FallbackKPICard from '@/components/ui/FallbackKPICard';

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error silently for monitoring
    logSilentError('Dashboard component error', error, {
      component: 'Dashboard Error Boundary',
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    });

    // In production, automatically retry once after brief delay
    if (!shouldShowDebugErrors()) {
      setTimeout(() => {
        reset();
      }, 1000);
    }
  }, [error, reset]);

  // In production, show fallback KPI cards instead of error message
  if (!shouldShowDebugErrors()) {
    return (
      <div className="max-w-container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <FallbackKPICard />
          <FallbackKPICard />
          <FallbackKPICard />
          <FallbackKPICard />
        </div>
      </div>
    );
  }

  // Development mode - show detailed error for debugging
  return (
    <div className="max-w-container mx-auto p-4 md:p-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <CardTitle className="text-red-800">
              [DEV] Dashboard Component Error
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-red-700">
            This error would be hidden in production (shows fallback cards instead).
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={reset}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Retry Component
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Refresh Dashboard
            </Button>
          </div>

          <details className="mt-4">
            <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800 font-medium">
              Error Details (Dev Only)
            </summary>
            <div className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 font-mono overflow-x-auto">
              <p><strong>Error:</strong> {error.message}</p>
              {error.digest && (
                <p className="mt-1"><strong>Error ID:</strong> {error.digest}</p>
              )}
              <pre className="mt-2 text-xs">{error.stack}</pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
} 