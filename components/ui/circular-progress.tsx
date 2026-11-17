import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: 'orange' | 'purple' | 'teal';
  className?: string;
}

export function CircularProgress({ 
  percentage, 
  size = 80, 
  strokeWidth = 8,
  color = 'orange',
  className 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Cap the visual progress at 100% but allow any percentage value
  const visualPercentage = Math.min(100, percentage);
  const strokeDashoffset = circumference - (visualPercentage / 100) * circumference;
  const isOverGoal = percentage >= 100;

  const colorClasses = {
    orange: {
      track: 'stroke-gray-200',
      progress: isOverGoal ? 'stroke-green-500' : 'stroke-orange-500'
    },
    purple: {
      track: 'stroke-gray-200',
      progress: isOverGoal ? 'stroke-green-500' : 'stroke-purple-500'
    },
    teal: {
      track: 'stroke-gray-200',
      progress: isOverGoal ? 'stroke-green-500' : 'stroke-teal-500'
    }
  };

  const colors = colorClasses[color];

  return (
    <svg
      className={cn("transform -rotate-90", className)}
      width={size}
      height={size}
    >
      {/* Background circle */}
      <circle
        className={colors.track}
        strokeWidth={strokeWidth}
        fill="none"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      {/* Progress circle */}
      <circle
        className={cn(colors.progress, "transition-all duration-300")}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        fill="none"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      {/* Percentage text - removed as it will be overlaid in the parent component */}
    </svg>
  );
}