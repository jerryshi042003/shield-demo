// Design tokens for consistent styling and demo flexibility

export const COLORS = {
  // Background colors
  primary: 'var(--color-page)',
  surface: 'var(--color-page)',
  card: 'hsl(var(--card))',
  // Brand colors
  brand: {
    primary: 'var(--color-brand-primary)',
    secondary: 'var(--color-brand-secondary)',
  },
  // Status colors
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
} as const;

export const SPACING = {
  // Common spacing values
  xs: 'var(--space-1)',
  sm: 'var(--space-2)',
  md: 'var(--space-4)',
  lg: 'var(--space-6)',
  xl: 'var(--space-8)',
} as const;

export const SECTION_STYLES = {
  // Enhanced typography hierarchy for better executive UX
  typography: {
    sectionTitle: 'text-2xl font-semibold',
    sectionDescription: 'text-sm text-slate-600',
    componentTitle: 'text-lg font-medium' // Document existing component style
  },
  
  headers: {
    critical: { 
      textColor: 'text-red-800',  // Stronger than before
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50',
      dividerColor: 'border-red-300' // Enhanced divider for critical
    },
    warning: { 
      textColor: 'text-orange-800', // Stronger than before
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      bgColor: 'bg-orange-50',
      dividerColor: 'border-orange-300'
    },
    normal: {
      textColor: 'text-gray-900',               // High-contrast title
      iconColor: 'text-gray-700',               // Neutral but visible
      borderColor: 'border-gray-400',           // Sharper edge definition
      bgColor: 'bg-gray-100',                   // Darker gray box
      dividerColor: 'border-gray-400'           // Matches the top border
    }
  },
  
  spacing: {
    sectionGap: 'mb-12',        // Increased breathing room between sections
    componentGap: 'space-y-8',  // Increased spacing within sections
    headerPadding: 'pb-4',      // Space below section header
    sectionPadding: 'pt-8',     // Space above section
    iconSize: 'h-6 w-6'         // Larger icons for better visibility
  },
  
  dividers: {
    sectionDivider: 'border-b',  // Horizontal line under headers
    fullWidth: 'w-full'
  }
} as const;

export const IMAGES = {
  // Centralized image paths for easy demo changes
  logo: '/kingsLogo.png',
  userProfile: '/drew_profile.png',
  placeholder: '/placeholder.svg',
} as const;

export const CHART_CONFIG = {
  // Chart-specific constants
  heights: {
    default: 200,
    small: 150,
    large: 300,
  },
  domains: {
    nhl: {
      tickets: [16000, 20000],
      revenue: [1.0, 2.0],
    },
    // AHL removed
  },
} as const;

export const ANIMATION = {
  // Animation timing constants
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  stagger: 0.05,
} as const; 
