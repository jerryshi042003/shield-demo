'use client';

export function TicketingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-200 h-36 rounded"></div>
        <div className="bg-gray-200 h-36 rounded"></div>
        <div className="bg-gray-200 h-36 rounded"></div>
      </div>
    </div>
  );
}