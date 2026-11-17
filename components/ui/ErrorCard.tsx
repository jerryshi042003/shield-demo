import React from 'react';

const ErrorCard = ({ className = '', onRetry }: { className?: string; onRetry?: () => void }) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
    <div className="flex items-center justify-center py-12">
      <span className="text-red-500 text-sm">Failed to load data. Please try again.</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Retry</button>
      )}
    </div>
  </div>
);

export default ErrorCard; 