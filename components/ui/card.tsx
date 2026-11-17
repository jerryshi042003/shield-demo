import * as React from "react"
import { ArrowUp, ArrowDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  delta?: number;
  baselineLabel?: string;
}

const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, delta, baselineLabel, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-surface-card text-text-primary shadow-sm",
        className
      )}
      {...props}
    >
      {children}
      {delta !== undefined && Math.abs(delta) >= 3 && (
        <div className={cn(
          "absolute top-2 right-2 flex flex-col items-center text-xs font-medium rounded-full px-2 py-1 border-2 shadow-sm",
          delta > 0 ? "text-green-600 bg-green-50 border-green-300" : "text-red-600 bg-red-50 border-red-300"
        )}>
          <div className="flex items-center gap-0.5">
            {delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
{typeof delta === 'number' && !isNaN(delta) ? Math.abs(delta).toFixed(1) : '0.0'}%
          </div>
          {baselineLabel && (
            <span className="block leading-none text-[10px] font-normal text-text-secondary">
              {baselineLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
