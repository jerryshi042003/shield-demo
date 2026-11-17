import { cn } from '@/lib/utils';

interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

export function TabButton({ isActive, children, className, ...props }: TabButtonProps) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={cn(
        'relative flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2',
        isActive
          ? 'text-foreground border-primary'
          : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
} 