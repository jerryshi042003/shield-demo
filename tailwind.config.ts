import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/lag/overview/**/*.{ts,tsx}',
    './features/lag/reports/**/*.{ts,tsx}',
    './features/lag/spom/**/*.{ts,tsx}',
    './features/lak/**/*.{ts,tsx}',
    './features/shared/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px'
      }
    },
    fontFamily: {
      sans: ['var(--font-sans)']
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    extend: {
      colors: {
        // Design system colors
        page: 'var(--color-page)',
        'surface-card': 'var(--color-surface-card)',
        'surface-pill-active': 'var(--color-surface-pill-active)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'border-default': 'var(--color-border-default)',

        // Keep existing shadcn/ui colors for compatibility
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)'
      },
      borderRadius: {
        card: 'var(--radius-card)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        subtle: 'var(--shadow-card)'
      },
      maxWidth: {
        container: 'var(--max-width-container)'
      },
      fontSize: {
        // Typography tokens
        'title-xl': [
          'var(--font-size-title-xl)',
          {
            lineHeight: 'var(--line-height-title-xl)',
            letterSpacing: 'var(--letter-spacing-title-xl)',
            fontWeight: 'var(--font-weight-title-xl)'
          }
        ],
        subtitle: [
          'var(--font-size-subtitle)',
          {
            lineHeight: 'var(--line-height-subtitle)',
            letterSpacing: '0px',
            fontWeight: 'var(--font-weight-subtitle)'
          }
        ],
        'tab-active': [
          'var(--font-size-tab)',
          {
            lineHeight: 'var(--line-height-tab)',
            letterSpacing: '0px',
            fontWeight: 'var(--font-weight-tab)'
          }
        ],
        'tab-inactive': [
          'var(--font-size-tab)',
          {
            lineHeight: 'var(--line-height-tab)',
            letterSpacing: '0px',
            fontWeight: 'var(--font-weight-tab)'
          }
        ],
        'metric-label': [
          'var(--font-size-metric-label)',
          {
            lineHeight: 'var(--line-height-metric-label)',
            letterSpacing: '0px',
            fontWeight: 'var(--font-weight-metric-label)'
          }
        ],
        'metric-value': [
          'var(--font-size-metric-value)',
          {
            lineHeight: 'var(--line-height-metric-value)',
            letterSpacing: '0px',
            fontWeight: 'var(--font-weight-metric-value)'
          }
        ],
        'section-heading': [
          'var(--font-size-section-heading)',
          {
            lineHeight: 'var(--line-height-section-heading)',
            letterSpacing: '0px',
            fontWeight: 'var(--font-weight-section-heading)'
          }
        ],
        'glossary-label': [
          'var(--font-size-glossary-label)',
          {
            lineHeight: 'var(--line-height-glossary-label)',
            letterSpacing: '0px',
            fontWeight: 'var(--font-weight-glossary-label)'
          }
        ],
        'glossary-value': [
          'var(--font-size-glossary-value)',
          {
            lineHeight: 'var(--line-height-glossary-value)',
            letterSpacing: '0px',
            fontWeight: 'var(--font-weight-glossary-value)'
          }
        ]
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
} satisfies Config;
