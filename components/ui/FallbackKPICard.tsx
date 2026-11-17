import { Card, CardContent } from '@/components/ui/card';

/**
 * Fallback KPI card that shows when components fail
 * Looks like a normal card with placeholder data to maintain visual consistency
 */
export default function FallbackKPICard() {
  return (
    <Card 
      className="border-0 rounded-lg shadow-sm h-36 relative hover:shadow-md transition-shadow duration-200"
      style={{ backgroundColor: '#ededed' }}
    >
      <CardContent className="p-4 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-sm text-gray-600 font-medium mb-1">
              System Updating
            </div>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-gray-400">
              ---
            </span>
          </div>
          
          <div className="text-xs text-gray-500">
            Data temporarily unavailable
          </div>
        </div>
      </CardContent>
    </Card>
  );
}