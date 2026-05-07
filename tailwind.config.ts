import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans:    ['var(--font-inter)',    'system-ui', 'sans-serif'],
        heading: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          DEFAULT: '#F5F1E8',
          50:  '#FDFCF9',
          100: '#F9F6EF',
          200: '#F5F1E8',
          300: '#EDE5D4',
          400: '#DED4BC',
        },
        navy: {
          DEFAULT: '#0B2440',
          50:  '#EFF3F8',
          100: '#D4DFEE',
          200: '#A9BFE0',
          300: '#7D9FCF',
          400: '#4F7CBD',
          500: '#2A5FA6',
          600: '#1A4A8A',
          700: '#0F3570',
          800: '#0B2440',
          900: '#061629',
        },
        terra: {
          DEFAULT: '#DD5A2A',
          50:  '#FDF2EE',
          100: '#FAE0D5',
          200: '#F5C0A8',
          300: '#EF9D7B',
          400: '#E87A50',
          500: '#DD5A2A',
          600: '#C04A1E',
          700: '#9E3C18',
          800: '#7C2F13',
          900: '#5C230E',
        },
        /* shadcn/radix colour tokens */
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        sm:   '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '20px',
        '2xl':'24px',
        '3xl':'32px',
        pill: '9999px',
      },
      boxShadow: {
        card:    '0 1px 3px rgba(11,36,64,0.06), 0 4px 12px rgba(11,36,64,0.04)',
        'card-lg':'0 4px 16px rgba(11,36,64,0.10), 0 1px 4px rgba(11,36,64,0.06)',
        glow:    '0 0 40px rgba(221,90,42,0.25)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' },                                to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in':  { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { from: { transform: 'translateX(-100%)' },              to: { transform: 'translateX(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up   0.2s ease-out',
        'fade-in':        'fade-in  0.3s ease-out',
        'slide-in':       'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
