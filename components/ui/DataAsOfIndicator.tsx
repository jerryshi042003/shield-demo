'use client';

interface DataAsOfIndicatorProps {
  selectedDate: string;
  className?: string;
  enabled?: boolean;
}


function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
}

export function DataAsOfIndicator({ 
  selectedDate, 
  className = '',
  enabled = true 
}: DataAsOfIndicatorProps) {
  if (!enabled) return null;

  // Simple format: show "Data as of Today" or "Data as of [date]"
  // Treat yesterday as "today" since data is still current
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const isToday = selectedDate === today || selectedDate === yesterday;
  const displayText = isToday ? 'Data as of Today' : `Data as of ${formatDate(selectedDate)}`;

  return (
    <div className={className}>
      <span className="text-sm font-medium text-muted-foreground">
        {displayText}
      </span>
    </div>
  );
}