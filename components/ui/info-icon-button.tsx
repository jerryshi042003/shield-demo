'use client';

import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ReactNode, useState } from 'react';

interface InfoIconButtonProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function InfoIconButton({
  children,
  className = "absolute bottom-2 right-2",
  align = "end",
  side = "top"
}: InfoIconButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Remove delay for immediate response
    setIsOpen(false);
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
  };

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Info
            role="button"
            tabIndex={0}
            className="h-4 w-4 text-blue-600/70 hover:text-blue-600 focus:text-blue-600 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            aria-label="More details"
          />
        </PopoverTrigger>
        <PopoverContent
          align={align}
          side={side}
          className="p-0 w-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </PopoverContent>
      </Popover>
    </div>
  );
}