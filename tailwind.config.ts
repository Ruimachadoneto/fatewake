import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ===== Paleta Fatewake =====
        bg: {
          DEFAULT: '#0B0F1A',
          card: '#141B2B',
          elevated: '#1B2238',
          inset: '#070A12',
          violet: '#2A1B3D',
          violetHigh: '#4B2E83'
        },
        ink: {
          DEFAULT: '#E8DFCF',
          muted: '#8B8294',
          dim: '#544A5C',
          gold: '#D4AF37'
        },
        gold: {
          DEFAULT: '#D4AF37',
          soft: '#E8C76A',
          glow: '#F5D97A',
          dark: '#9C7F1E'
        },
        blood: {
          DEFAULT: '#9D1F2D',
          soft: '#C04050',
          glow: '#E07084',
          dark: '#5A0F1A'
        },
        arcane: {
          DEFAULT: '#7B3FA0',
          soft: '#A56BC4',
          glow: '#C998E0',
          deep: '#2A1B3D'
        },
        hp: { DEFAULT: '#C0392B', soft: '#E67E6A', bar: '#9D1F2D' },
        stress: { DEFAULT: '#7B3FA0', soft: '#A56BC4', bar: '#4B2E83' },
        armor: { DEFAULT: '#3D7BB8', soft: '#6FA3D4', bar: '#1E4A78' },
        hope: { DEFAULT: '#D4AF37', soft: '#E8C76A', glow: '#F5D97A' },
        fear: { DEFAULT: '#9D1F2D', soft: '#C04050', glow: '#E07084' },
        dominio: {
          arcano: '#9D5BE0',
          codice: '#3FB8D4',
          esplendor: '#F5D97A',
          graca: '#E879C4',
          lamina: '#E04050',
          meianoite: '#4A3D6B',
          falange: '#5BC470',
          sabedoria: '#3FD4A0',
          valor: '#E89A3F'
        },
        border: {
          DEFAULT: '#252B3D',
          strong: '#3D3F5C',
          gold: '#D4AF37'
        }
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'glow-gold': '0 0 24px rgba(212, 175, 55, 0.25), 0 0 48px rgba(212, 175, 55, 0.1)',
        'glow-blood': '0 0 24px rgba(157, 31, 45, 0.3), 0 0 48px rgba(157, 31, 45, 0.12)',
        'glow-arcane': '0 0 24px rgba(123, 63, 160, 0.3), 0 0 48px rgba(123, 63, 160, 0.12)',
        'glow-hp': '0 0 12px rgba(192, 57, 43, 0.55), 0 0 4px rgba(192, 57, 43, 0.85)',
        'glow-armor': '0 0 12px rgba(61, 123, 184, 0.55), 0 0 4px rgba(61, 123, 184, 0.85)',
        'inner-deep': 'inset 0 2px 12px rgba(0, 0, 0, 0.7)',
        'card-glow': '0 4px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
      },
      backgroundImage: {
        'cosmic': 'radial-gradient(ellipse at top, rgba(75, 46, 131, 0.15), transparent 60%), radial-gradient(ellipse at bottom right, rgba(157, 31, 45, 0.08), transparent 50%), linear-gradient(180deg, #0B0F1A 0%, #070A12 100%)',
        'card-gold': 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, transparent 50%, rgba(212, 175, 55, 0.04) 100%)',
        'card-blood': 'linear-gradient(135deg, rgba(157, 31, 45, 0.1) 0%, transparent 50%, rgba(157, 31, 45, 0.04) 100%)',
        'card-arcane': 'linear-gradient(135deg, rgba(123, 63, 160, 0.12) 0%, transparent 50%, rgba(123, 63, 160, 0.04) 100%)'
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'pulse-fear': 'pulse-fear 1.5s ease-in-out infinite',
        'shake': 'shake 0.3s ease-in-out',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 16px rgba(212, 175, 55, 0.2)' },
          '50%': { boxShadow: '0 0 32px rgba(212, 175, 55, 0.5), 0 0 64px rgba(212, 175, 55, 0.2)' }
        },
        'pulse-fear': {
          '0%, 100%': { boxShadow: '0 0 16px rgba(157, 31, 45, 0.3)' },
          '50%': { boxShadow: '0 0 32px rgba(157, 31, 45, 0.6), 0 0 64px rgba(157, 31, 45, 0.3)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' }
        },
        shimmer: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' }
        }
      },
      fontSize: { '2xs': '0.625rem' }
    }
  },
  safelist: [
    // Classes geradas dinamicamente via .replace('text-','bg-') em BarraRecurso
    'bg-hp-soft', 'bg-arcane-glow', 'bg-armor-soft', 'bg-gold-soft', 'bg-blood-glow',
  ],
  plugins: []
} satisfies Config;
