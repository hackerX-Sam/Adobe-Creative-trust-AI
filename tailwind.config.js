/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--c-base)',
        sidebar: 'var(--c-sidebar)',
        card: 'var(--c-card)',
        elevated: 'var(--c-elevated)',
        elevated2: 'var(--c-elevated2)',
        line: 'var(--c-line)',
        lineBright: 'var(--c-line-bright)',
        accent: '#FF3B30',
        accent2: '#FF6A00',
        ink: 'var(--c-ink)',
        ink2: 'var(--c-ink2)',
        ink3: 'var(--c-ink3)',
        success: '#32D583',
        warning: '#F5B942',
        danger: '#FF4D4F',
        'accent-dim': 'rgba(255,59,48,0.10)',
        'accent-line': 'rgba(255,59,48,0.35)',
      },
      fontFamily: {
        sans: [
          '"Source Sans 3"',
          '"Adobe Clean"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      fontSize: {
        'metric': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.02em' }],
        'page': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        'section': ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        'card-title': ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'body': ['0.875rem', { lineHeight: '1.375rem' }],
        'tiny': ['0.6875rem', { lineHeight: '1rem' }],
        'micro': ['0.625rem', { lineHeight: '0.9375rem' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
        elevate: '0 8px 24px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.35)',
        pop: '0 12px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
        accent: '0 4px 16px rgba(255,59,48,0.25)',
      },
      keyframes: {
        scan: {
          '0%': { top: '2%' },
          '50%': { top: '97%' },
          '100%': { top: '2%' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        drawerIn: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        popIn: {
          from: { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        dashRotate: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        scan: 'scan 2.6s cubic-bezier(0.45,0,0.55,1) infinite',
        fadeUp: 'fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
        fadeIn: 'fadeIn 0.3s ease both',
        slideIn: 'slideIn 0.35s cubic-bezier(0.22,1,0.36,1) both',
        drawerIn: 'drawerIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
        popIn: 'popIn 0.22s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
