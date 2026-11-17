'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { shouldShowDebugErrors } from '@/lib/utils/environment';
import { logSilentError } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error silently for debugging/monitoring
    logSilentError('App-level error occurred', error, {
      component: 'App Error Boundary',
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    });

    // In production, silently redirect to dashboard instead of showing error
    if (!shouldShowDebugErrors()) {
      // Small delay to ensure error is logged
      setTimeout(() => {
        redirect('/');
      }, 100);
    }
  }, [error]);

  // In production, show nothing (redirect will happen)
  if (!shouldShowDebugErrors()) {
    return null;
  }

  // Development mode - show detailed error for debugging
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              [DEV] App Error Occurred
            </h1>
            
            <p className="text-gray-600 mb-6">
              This error would be hidden in production. Error: {error.message}
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={reset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <details className="text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">Error Details (Dev Only)</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {error.stack}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
} 